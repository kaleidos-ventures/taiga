/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */
import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';
import { Membership, Permissions, Story, User } from '@taiga/data';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { map, Subject } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { initAssignUser } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectMembers } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { filterNil } from '~/app/shared/utils/operators';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

interface AssignComponentState {
  members: Membership['user'][];
  membersPermissions: Record<Membership['user']['username'], Permissions[]>;
  assigned: Story['assignees'];
  search: string;
  currentUser: User;
}
@Component({
  selector: 'tg-assign-user',
  standalone: true,
  imports: [
    CommonTemplateModule,
    UserAvatarComponent,
    TuiAutoFocusModule,
    FormsModule,
    ReactiveFormsModule,
    TuiLinkModule,
    TuiScrollbarModule,
    TuiToggleModule,
    TuiSvgModule,
    TuiHintModule,
    UserCardComponent,
    InputsModule,
  ],
  templateUrl: './assign-user.component.html',
  styleUrls: ['./assign-user.component.css'],
  providers: [RxState],
})
export class AssignUserComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput')
  public searchInput!: ElementRef;

  @Output()
  public requestClose = new EventEmitter<void>();

  @Output()
  public assign = new EventEmitter<Membership['user']>();

  @Output()
  public unassign = new EventEmitter<Membership['user']>();

  @Input()
  public viewOnly = false;

  @Input()
  public ref?: number;

  @Input()
  public width = 0;

  @Input()
  public set assigned(members: Story['assignees']) {
    const currentUser = this.state.get('currentUser');
    const currentUserAssigned = members.find((member) => {
      return member.username === currentUser.username;
    });
    const assignedMembers = members.filter(
      (member) => member.username !== currentUser.username
    );

    // current user on top
    if (currentUserAssigned) {
      assignedMembers.unshift(currentUser);
    }
    this.state.set({ assigned: assignedMembers });
  }

  @HostListener('document:keydown.escape')
  public onEsc() {
    this.requestClose.next();
  }

  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const members = state.members.filter((member) => {
        const assigned = state.assigned.find(
          (assigned) => assigned.username === member.username
        );

        if (assigned) {
          return false;
        }

        if (state.search) {
          return this.checkMemberSearch(state.search, member);
        }

        return true;
      });

      // current user on top
      const currentUserMember = members.find((member) => {
        return member.username === state.currentUser.username;
      });
      if (currentUserMember) {
        members.filter((member) => {
          if (member.username === state.currentUser.username) {
            return false;
          }
          return true;
        });
        members.unshift(currentUserMember);
      }

      return {
        ...state,
        members,
      };
    })
  );

  public readonly search$ = new Subject<string>();

  public searchTextForm!: FormGroup;
  public singleAssigned = 40;
  public minAssignHeight = 187;

  public getCustomWidth() {
    return this.width ? this.width : null;
  }

  constructor(
    private store: Store,
    private state: RxState<AssignComponentState>,
    private fb: FormBuilder,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService
  ) {
    this.store.dispatch(initAssignUser());

    this.initState();
  }

  public ngOnInit(): void {
    this.searchTextForm = this.fb.group({
      searchText: '',
    });
  }

  public ngAfterViewInit() {
    requestAnimationFrame(() => {
      (document.querySelector('.assignees-title') as HTMLElement)?.focus();
    });
  }

  public ngOnDestroy() {
    if (this.ref) {
      requestAnimationFrame(() => {
        const mainFocus = document.querySelector(
          `tg-kanban-story[data-ref='${this.ref!}'] .story-kanban-ref-focus`
        );
        if (mainFocus) {
          (mainFocus as HTMLElement).focus();
        }
      });
    }
  }

  public initState() {
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
    this.state.connect(
      'members',
      this.store.select(selectMembers).pipe(
        filterNil(),
        map((members) => {
          return members.map((member) => member.user);
        })
      )
    );
    this.state.connect(
      'membersPermissions',
      this.store.select(selectMembers).pipe(
        filterNil(),
        map((members) => {
          const permissions: Record<
            Membership['user']['username'],
            Permissions[]
          > = {};
          members.forEach((member) => {
            permissions[member.user.username] = member.role.permissions!;
          });
          return permissions;
        })
      )
    );
    this.state.connect('search', this.search$);
  }

  public checkMemberSearch(search: string, member: Membership['user']) {
    const rgx = new RegExp(
      `${UtilsService.normalizeText(search.replace(/^@/, ''))}`,
      'gi'
    );
    const fullname = UtilsService.normalizeText(member.fullName);
    const username = UtilsService.normalizeText(
      member.username.replace(/^@/, '')
    );

    return rgx.test(fullname) || rgx.test(username);
  }

  public onAssign(event: Event, member: Membership['user']) {
    this.assign.next(member);
    if (event.type === 'keydown') {
      const announcement = this.translocoService.translate(
        'project.assign_user.assigned-aria',
        {
          name: member.fullName,
        }
      );
      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            (this.searchInput.nativeElement as HTMLElement).focus();
            this.liveAnnouncer.clear();
          }, 50);
        },
        () => {
          // error
        }
      );
    } else {
      (this.searchInput.nativeElement as HTMLElement).focus();
    }
  }

  public onUnassign(event: Event, assignedUser: Membership['user']) {
    this.unassign.next(assignedUser);
    if (event.type === 'keydown') {
      const announcement = this.translocoService.translate(
        'project.assign_user.unassigned-aria',
        {
          name: assignedUser.fullName,
        }
      );
      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            this.liveAnnouncer.clear();
          }, 50);
        },
        () => {
          // error
        }
      );
    }
  }

  public setWidth() {
    return this.width > 0 ? `${this.width}px` : null;
  }

  public setMaxInlineSize() {
    return this.width > 0 ? 'auto' : null;
  }

  public trackByMember(_index: number, member: Membership['user']) {
    return member.username;
  }
}
