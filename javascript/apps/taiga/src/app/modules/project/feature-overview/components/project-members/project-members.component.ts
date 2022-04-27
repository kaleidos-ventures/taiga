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
import { Invitation, Membership } from '@taiga/data';
import {
  selectInvitations,
  selectMembers,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { initMembers } from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { map } from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';

@Component({
  selector: 'tg-project-members',
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectMembersComponent {
  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const currentUser = this.auth.getUser();

      const currentMember = state.members.find(
        (member) => member.user.username === currentUser?.username
      );
      const members = state.members.filter(
        (member) => member.user.username !== currentUser?.username
      );

      const membersAndInvitations = [
        ...(currentMember ? [currentMember] : []),
        ...members,
        ...state.invitations,
      ];

      return {
        loading: !state.members.length,
        viewAllMembers: membersAndInvitations.length > 10,
        previewMembers: membersAndInvitations.slice(0, 10),
        members: membersAndInvitations,
        pending: state.invitations.length,
        invitations: state.invitations,
        currentMember
      };
    })
  );
  public showAllMembers = false;
  public invitePeople = false;
  public resetForm = false;

  constructor(
    private auth: AuthService,
    private store: Store,
    private state: RxState<{
      members: Membership[];
      invitations: Invitation[];
    }>
  ) {
    this.store.dispatch(initMembers());
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('invitations', this.store.select(selectInvitations));
  }

  public project$ = this.store.select(selectCurrentProject);

  public invitePeopleModal() {
    this.resetForm = this.invitePeople;
    this.invitePeople = !this.invitePeople;
  }
}
