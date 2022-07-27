/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, User } from '@taiga/data';
import { map } from 'rxjs/operators';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { setMembersPage } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectMembers,
  selectMembersLoading,
  selectMembersOffset,
  selectTotalMemberships,
  selectAnimationDisabled,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { UntilDestroy } from '@ngneat/until-destroy';
import { slideInOut400 } from '~/app/shared/utils/animations';

@UntilDestroy()
@Component({
  selector: 'tg-members-list',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [slideInOut400],
})
export class MembersListComponent {
  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;

  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.members.length - 1;

      return {
        ...model,
        pageStart,
        pageEnd,
        hasNextPage: pageEnd < model.total,
        hasPreviousPage: !!model.offset,
      };
    })
  );

  constructor(
    private store: Store,
    private state: RxState<{
      members: Membership[];
      loading: boolean;
      total: number;
      offset: number;
      user: User | null;
      animationDisabled: boolean;
    }>
  ) {
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('loading', this.store.select(selectMembersLoading));
    this.state.connect('total', this.store.select(selectTotalMemberships));
    this.state.connect('offset', this.store.select(selectMembersOffset));
    this.state.connect('user', this.store.select(selectUser));
    this.state.connect(
      'animationDisabled',
      this.store.select(selectAnimationDisabled)
    );
  }

  public next() {
    this.store.dispatch(
      setMembersPage({ offset: this.state.get('offset') + MEMBERS_PAGE_SIZE })
    );
  }

  public prev() {
    this.store.dispatch(
      setMembersPage({ offset: this.state.get('offset') - MEMBERS_PAGE_SIZE })
    );
  }

  public trackByUsername(_index: number, member: Membership) {
    return member.user.username;
  }

  public trackByIndex(index: number) {
    return index;
  }
}
