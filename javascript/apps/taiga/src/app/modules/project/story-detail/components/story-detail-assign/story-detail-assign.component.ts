/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslocoService, TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  Membership,
  Permissions,
  Project,
  Role,
  Status,
  Story,
  User,
} from '@taiga/data';
import { map, merge } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectMembers } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { StoryDetailForm } from '~/app/modules/project/story-detail/story-detail.component';
import { PermissionsService } from '~/app/services/permissions.service';
import { WsService } from '~/app/services/ws';
import { ResizedEvent } from '~/app/shared/resize/resize.model';
import { filterNil } from '~/app/shared/utils/operators';
import { TuiButtonModule } from '@taiga-ui/core';
import { TuiScrollbarModule } from '@taiga-ui/core/components/scrollbar';
import { TuiActiveZoneModule } from '@taiga-ui/cdk';
import { TuiDropdownModule } from '@taiga-ui/core/directives/dropdown';

import { CommonModule } from '@angular/common';
import { TooltipDirective } from '@taiga/ui/tooltip';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { AssignUserComponent } from '~/app/modules/project/components/assign-user/assign-user.component';

export interface StoryState {
  isA11yDragInProgress: boolean;
  project: Project;
  showAssignUser: boolean;
  assignees: Story['assignees'];
  currentUser: User;
  canEdit: boolean;
  members: Membership[];
}
@UntilDestroy()
@Component({
  selector: 'tg-story-detail-assign',
  templateUrl: './story-detail-assign.component.html',
  styleUrls: ['./story-detail-assign.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    HasPermissionDirective,
    ResizedDirective,
    TuiDropdownModule,
    TuiActiveZoneModule,
    TuiScrollbarModule,
    UserAvatarComponent,
    TooltipDirective,
    TuiButtonModule,
    AssignUserComponent,
  ],
})
export class StoryDetailAssignComponent implements OnChanges {
  @Input()
  public form!: FormGroup<StoryDetailForm>;

  @Input()
  public story!: KanbanStory;

  @ViewChildren('assigned', { read: ViewContainerRef })
  public listedAssigneds!: QueryList<ViewContainerRef>;

  @ViewChild('assignedMemberList')
  public assignedMemberList!: ElementRef<HTMLElement>;

  @ViewChild('addAssignee', { read: ElementRef, static: false })
  public addAssignee!: ElementRef<HTMLElement>;

  public model$ = this.state.select();
  public assignedListA11y = '';
  public restAssigneesLenght = '';
  public dropdownWidth = 0;

  constructor(
    private state: RxState<StoryState>,
    private store: Store,
    private permissionService: PermissionsService,
    private translocoService: TranslocoService,
    private liveAnnouncer: LiveAnnouncer,
    private wsService: WsService
  ) {
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
    this.state.connect(
      'canEdit',
      this.permissionService.hasPermissions$('story', ['modify'])
    );
    this.state.connect(
      'members',
      this.store.select(selectMembers).pipe(filterNil())
    );

    this.events();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.story) {
      const currentUser = this.state.get('currentUser');
      const currentUserAssigned = this.story.assignees.find((assignees) => {
        return assignees.username === currentUser.username;
      });
      const assignedMembers = this.story.assignees.filter(
        (member) => member.username !== currentUser.username
      );

      // current user on top
      if (currentUserAssigned) {
        assignedMembers.unshift(currentUser);
      }

      this.state.set({ assignees: assignedMembers });
    }
  }

  public trackByStatus(_index: number, status: Status) {
    return status.id;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public toggleAssignUser(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.state.set('showAssignUser', ({ showAssignUser }) => {
      return !showAssignUser;
    });
  }

  public assign(member: Membership['user']) {
    if (this.story.ref) {
      this.store.dispatch(
        StoryDetailActions.assignMember({ member, storyRef: this.story.ref })
      );
    }
  }

  public unassign(member: Membership['user']) {
    if (this.story.ref) {
      this.store.dispatch(
        StoryDetailActions.unAssignMember({ member, storyRef: this.story.ref })
      );
    }
  }

  public unassignFromList(event: Event, member: Membership['user']) {
    event.preventDefault();
    event.stopPropagation();
    if (this.story.ref) {
      this.store.dispatch(
        StoryDetailActions.unAssignMember({ member, storyRef: this.story.ref })
      );
      if (event.type === 'keydown') {
        const announcement = this.translocoService.translate(
          'common_story.unassigned-aria',
          {
            name: member.fullName,
          }
        );
        this.liveAnnouncer.announce(announcement, 'assertive').then(
          () => {
            setTimeout(() => {
              if (this.listedAssigneds.length) {
                this.assignedMemberList.nativeElement.focus();
              } else {
                requestAnimationFrame(() => {
                  this.addAssignee.nativeElement.focus();
                });
              }
            }, 50);
          },
          () => {
            // error
          }
        );
      }
    }
  }

  public onAssignUserActiveZoneChange(active: boolean) {
    if (!active) {
      this.closeAssignDropdown();
    }
  }

  public closeAssignDropdown() {
    this.state.set({ showAssignUser: false });
    if (this.listedAssigneds.length) {
      this.assignedMemberList.nativeElement.focus();
    } else {
      requestAnimationFrame(() => {
        this.addAssignee.nativeElement.focus();
      });
    }
  }

  public calculateDropdownWidth(event: ResizedEvent) {
    this.dropdownWidth = event.newRect.width;
  }

  private events() {
    merge(
      this.wsService
        .projectEvents<Role>('projectroles.update')
        .pipe(map((data) => data.event.content)),
      this.wsService
        .userEvents<{ membership: Membership }>('projectmemberships.update')
        .pipe(map((data) => data.event.content.membership.role))
    )
      .pipe(untilDestroyed(this))
      .subscribe((permissions) => {
        this.store.dispatch(ProjectActions.fetchProjectMembers());
        this.unassignRoleMembersWithoutPermissions(permissions as Role);
      });
  }

  private unassignRoleMembersWithoutPermissions(role: Role) {
    if (!role.permissions.includes(Permissions.viewStory)) {
      const members = this.state.get('members');

      const membersWithoutViewPermissions = members.filter((member) => {
        return member.role.name === role.name;
      });

      if (this.story.ref) {
        this.store.dispatch(
          StoryDetailActions.unassignMembers({
            storyRef: this.story.ref,
            members: membersWithoutViewPermissions,
          })
        );
      }
    }
  }
}
