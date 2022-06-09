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
import { Membership } from '@taiga/data';
import { map } from 'rxjs/operators';
import { setMembersPage } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import {
  selectMembers,
  selectMembersLoading,
  selectMembersOffset,
  selectTotalMemberships,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';

@Component({
  selector: 'tg-members-list',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class MembersListComponent {
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
    }>
  ) {
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('loading', this.store.select(selectMembersLoading));
    this.state.connect('total', this.store.select(selectTotalMemberships));
    this.state.connect('offset', this.store.select(selectMembersOffset));
  }

  public next() {
    this.store.dispatch(
      setMembersPage({ offset: this.state.get('offset') + 10 })
    );
  }

  public prev() {
    this.store.dispatch(
      setMembersPage({ offset: this.state.get('offset') - 10 })
    );
  }

  public trackByUsername(_index: number, member: Membership) {
    return member.user.username;
  }

  public trackByIndex(index: number) {
    return index;
  }
}
