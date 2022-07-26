/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Invitation, User } from '@taiga/data';
import {
  selectInvitations,
  selectInvitationsLoading,
  selectInvitationsOffset,
  selectTotalInvitations,
} from '~/app/modules/project/settings/feature-members/+state/selectors/members.selectors';
import { setPendingPage } from '~/app/modules/project/settings/feature-members/+state/actions/members.actions';
import { RxState } from '@rx-angular/state';
import { map } from 'rxjs/operators';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';

@Component({
  selector: 'tg-pending-members-list',
  templateUrl: './pending-members-list.component.html',
  styleUrls: ['./pending-members-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingMembersListComponent {
  public MEMBERS_PAGE_SIZE = MEMBERS_PAGE_SIZE;

  public model$ = this.state.select().pipe(
    map((model) => {
      const pageStart = model.offset + 1;
      const pageEnd = pageStart + model.invitations.length - 1;

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
      invitations: Invitation[];
      loading: boolean;
      total: number;
      offset: number;
    }>
  ) {
    this.state.connect('invitations', this.store.select(selectInvitations));
    this.state.connect('loading', this.store.select(selectInvitationsLoading));
    this.state.connect('total', this.store.select(selectTotalInvitations));
    this.state.connect('offset', this.store.select(selectInvitationsOffset));
  }

  public next() {
    this.store.dispatch(
      setPendingPage({ offset: this.state.get('offset') + MEMBERS_PAGE_SIZE })
    );
  }

  public prev() {
    this.store.dispatch(
      setPendingPage({ offset: this.state.get('offset') - MEMBERS_PAGE_SIZE })
    );
  }

  public trackByUsername(_index: number, invitation: Invitation) {
    return invitation.user?.username;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public getUser(member: Invitation): Partial<User> {
    if (member.user) {
      return member.user;
    }
    return { email: member.email };
  }

  public resend() {
    // todo
  }
}
