/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Optional,
  SimpleChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project, Story, User } from '@taiga/data';
import { distinctUntilChanged, map } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectActiveA11yDragDropStory } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { PermissionsService } from '~/app/services/permissions.service';
import { filterNil } from '~/app/shared/utils/operators';
import { KanbanStatusComponent } from '../status/kanban-status.component';

export interface StoryState {
  isA11yDragInProgress: boolean;
  project: Project;
  showAssignUser: boolean;
  assignees: Story['assignees'];
  currentUser: User;
  canEdit: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-kanban-story',
  templateUrl: './kanban-story.component.html',
  styleUrls: ['./kanban-story.component.css'],
  providers: [RxState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanStoryComponent implements OnChanges, OnInit {
  @Input()
  public story!: KanbanStory;

  @Input()
  @HostBinding('attr.data-position')
  public index!: number;

  @Input()
  public total = 0;

  @HostBinding('class.drag-shadow')
  public get dragShadow() {
    return this.story._shadow || this.story._dragging;
  }

  @HostBinding('attr.data-ref')
  public get ref() {
    return this.story.ref;
  }

  public assignedListA11y = '';
  public reversedAssignees: Membership['user'][] = [];
  public restAssigneesLenght = '';
  public hintAssignUser = false;
  public cardHasFocus = false;

  public readonly model$ = this.state.select();

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    public state: RxState<StoryState>,
    private location: Location,
    private store: Store,
    private el: ElementRef,
    @Optional()
    @Inject(KanbanStatusComponent)
    private kabanStatus: KanbanStatusComponent,
    private permissionService: PermissionsService,
    private cd: ChangeDetectorRef
  ) {
    this.state.set({
      assignees: [],
      showAssignUser: false,
    });
  }

  public ngOnInit(): void {
    this.state.connect(
      'isA11yDragInProgress',
      this.store.select(selectActiveA11yDragDropStory).pipe(
        map((it) => it.ref === this.story.ref),
        distinctUntilChanged()
      )
    );
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
    this.state.connect(
      'canEdit',
      this.permissionService.hasPermissions$('story', ['modify'])
    );

    this.state.hold(this.state.select('currentUser'), () => {
      this.setAssigneesInState();
      this.setAssignedListA11y();
      this.calculateRestAssignes();
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.story && this.story._shadow) {
      requestAnimationFrame(() => {
        this.scrollToDragStoryIfNotVisible();
      });
    }

    if (changes.story && this.state.get('currentUser')) {
      this.setAssigneesInState();
      this.setAssignedListA11y();
      this.calculateRestAssignes();
    }
  }

  public setAssigneesInState() {
    const assignees: Membership['user'][] = [];

    const currentUserMember = this.story.assignees.find((member) => {
      return member.username === this.state.get('currentUser').username;
    });

    const members = this.story.assignees.filter((member) => {
      if (member.username === this.state.get('currentUser').username) {
        return false;
      }

      return true;
    });

    if (currentUserMember) {
      assignees.push(currentUserMember);
    }
    members.forEach((member) => assignees.push(member));
    // Required for styling reasons (inverted flex)
    this.reversedAssignees = [...assignees].reverse();

    this.state.set({ assignees });
  }

  public setAssignedListA11y() {
    this.assignedListA11y = this.state
      .get('assignees')
      .map((assigned) => assigned.fullName)
      .join(', ');
  }

  public handleCardFocus(value: boolean) {
    this.cardHasFocus = value;
  }

  public openStory(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.story.ref) {
      this.location.go(
        `project/${this.state.get('project').id}/${
          this.state.get('project').slug
        }/stories/${this.story.ref}`,
        undefined,
        {
          fromCard: true,
        }
      );
    }
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
        KanbanActions.assignMember({ member, storyRef: this.story.ref })
      );
    }
  }

  public unassign(member: Membership['user']) {
    if (this.story.ref) {
      this.store.dispatch(
        KanbanActions.unassignMember({ member, storyRef: this.story.ref })
      );
    }
  }

  public closeAssignDropdown() {
    this.state.set({ showAssignUser: false });
  }

  public trackByIndex(index: number) {
    return index;
  }

  public calculateRestAssignes() {
    const restAssigneesLenght = this.state.get('assignees').length - 3;
    if (restAssigneesLenght < 99) {
      this.restAssigneesLenght = `${restAssigneesLenght}+`;
    } else {
      this.restAssigneesLenght = '…';
    }
  }

  public displayHintAssignUser() {
    this.hintAssignUser = !this.hintAssignUser;
  }

  private scrollToDragStoryIfNotVisible() {
    const statusScrollBottom =
      this.kabanStatus.kanbanVirtualScroll?.scrollStrategy.viewport?.elementRef.nativeElement.getBoundingClientRect()
        .bottom;

    if (statusScrollBottom) {
      const newTop =
        this.nativeElement.getBoundingClientRect().bottom -
        statusScrollBottom +
        1;

      if (newTop > 0) {
        this.kabanStatus.kanbanVirtualScroll?.scrollStrategy.scrollTo({
          top: newTop,
        });
      }
    }
  }
}
