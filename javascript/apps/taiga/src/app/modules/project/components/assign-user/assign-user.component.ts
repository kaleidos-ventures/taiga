/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiScrollbarModule } from '@taiga-ui/core';
import { Membership, Story, User } from '@taiga/data';
import Diacritics from 'diacritic';
import { map, startWith, Subject } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { initAssignUser } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectMembers } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { filterNil } from '~/app/shared/utils/operators';

interface AssignComponentState {
  members: Membership['user'][];
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
    TuiScrollbarModule,
    UserCardComponent,
  ],
  templateUrl: './assign-user.component.html',
  styleUrls: ['./assign-user.component.css'],
  providers: [RxState],
})
export class AssignUserComponent {
  @Output()
  public requestClose = new EventEmitter<void>();

  @Output()
  public assign = new EventEmitter<Membership['user']>();

  @Output()
  public unassign = new EventEmitter<Membership['user']>();

  @Input()
  public set assigned(members: Story['assignees']) {
    this.state.set({ assigned: members });
  }

  @HostListener('document:keydown.escape')
  public onEsc() {
    this.requestClose.next();
  }

  // TODO: The project members that cannot access stories should appear as a disabled list item with a label that informs of the situation.
  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const currentUserMember = state.members.find((member) => {
        return member.username === state.currentUser.username;
      });

      const members = state.members.filter((member) => {
        if (member.username === state.currentUser.username) {
          return false;
        }

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
      const currentUserAssigned = state.assigned.find(
        (assigned) => assigned.username === state.currentUser.username
      );

      if (currentUserMember && !currentUserAssigned) {
        members.unshift(currentUserMember);
      }

      return {
        ...state,
        members,
      };
    })
  );

  public readonly search$ = new Subject<string>();
  public searchText = '';

  constructor(
    private store: Store,
    private state: RxState<AssignComponentState>
  ) {
    this.store.dispatch(initAssignUser());

    this.initState();
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
        }),
        startWith([])
      )
    );
    this.state.connect('search', this.search$);
  }

  public checkMemberSearch(search: string, member: Membership['user']) {
    const rgx = new RegExp(
      `${this.normalizeText(search.replace(/^@/, ''))}`,
      'gi'
    );
    const fullname = this.normalizeText(member.fullName);
    const username = this.normalizeText(member.username.replace(/^@/, ''));

    return rgx.test(fullname) || rgx.test(username);
  }

  public onAssign(member: Membership['user']) {
    this.searchText = '';
    this.search$.next('');

    this.assign.next(member);
  }

  public trackByMember(_index: number, member: Membership['user']) {
    return member.username;
  }

  private normalizeText(text: string) {
    const partialNormalize = Diacritics.clean(text).toLowerCase();
    return partialNormalize.normalize('NFD').replace(/[Ð-ð]/g, 'd');
  }
}
