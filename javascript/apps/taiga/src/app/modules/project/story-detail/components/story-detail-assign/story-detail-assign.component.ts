/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project, Status, Story, User } from '@taiga/data';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { StoryDetailForm } from '~/app/modules/project/story-detail/story-detail.component';
import { ResizedEvent } from '~/app/shared/resize/resize.model';

export interface StoryState {
  isA11yDragInProgress: boolean;
  project: Project;
  showAssignUser: boolean;
  assignees: Story['assignees'];
  currentUser: User;
}
@Component({
  selector: 'tg-story-detail-assign',
  templateUrl: './story-detail-assign.component.html',
  styleUrls: ['./story-detail-assign.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryDetailAssignComponent {
  @Input()
  public form!: FormGroup<StoryDetailForm>;

  @Input()
  public story!: KanbanStory;

  public model$ = this.state.select();
  public assignedListA11y = '';
  public restAssigneesLenght = '';
  public dropdownWidth = 0;

  constructor(private state: RxState<StoryState>, private store: Store) {}

  public trackByStatus(_index: number, status: Status) {
    return status.slug;
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
        StoryDetailActions.unassignMember({ member, storyRef: this.story.ref })
      );
    }
  }

  public onAssignUserActiveZoneChange(active: boolean) {
    if (!active) {
      this.closeAssignDropdown();
    }
  }

  public closeAssignDropdown() {
    this.state.set({ showAssignUser: false });
  }

  public calculateDropdownWidth(event: ResizedEvent) {
    this.dropdownWidth = event.newRect.width;
  }
}
