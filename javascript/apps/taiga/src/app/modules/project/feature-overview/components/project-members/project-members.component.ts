/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Invitation, Membership, Project, User } from '@taiga/data';
import {
  selectInvitations,
  selectMembers,
  selectOnAcceptedInvitation,
  selectTotalMemberships,
  selectTotalInvitations,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import {
  initMembers,
  nextMembersPage,
} from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { filter, map, take } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectNotificationClosed } from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { ProjectMembersListComponent } from '../project-members-list/project-members-list.component';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';

@Component({
  selector: 'tg-project-members',
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectMembersComponent {
  @ViewChild(ProjectMembersListComponent)
  public projectMembersList!: ProjectMembersListComponent;

  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const user = [...state.members, ...state.invitations].find(
        (member) => member?.user?.username === state.user?.username
      );
      const currentMember = state.members.find(
        (member) => member?.user?.username === state.user?.username
      );
      const members = state.members.filter(
        (member) => member.user.username !== state.user?.username
      );

      const invitations = state.invitations.filter(
        (member) => member?.user?.username !== state.user?.username
      );

      const membersAndInvitations = [
        ...(user ? [user] : []),
        ...members,
        ...invitations,
      ];

      return {
        ...state,
        loading: !state.members.length,
        viewAllMembers:
          state.totalMemberships + state.totalInvitations > MEMBERS_PAGE_SIZE,
        previewMembers: membersAndInvitations.slice(0, MEMBERS_PAGE_SIZE),
        members: membersAndInvitations,
        pending: state.invitations.length,
        currentMember,
      };
    })
  );
  public showAllMembers = false;
  public invitePeople = false;
  public resetForm = false;

  constructor(
    private store: Store,
    private state: RxState<{
      project: Project;
      members: Membership[];
      invitations: Invitation[];
      notificationClosed: boolean;
      user: User | null;
      onAcceptedInvitation: boolean;
      totalMemberships: number;
      totalInvitations: number;
    }>
  ) {
    this.store.dispatch(initMembers());
    this.state.connect(
      'totalMemberships',
      this.store.select(selectTotalMemberships)
    );
    this.state.connect(
      'totalInvitations',
      this.store.select(selectTotalInvitations)
    );
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('invitations', this.store.select(selectInvitations));
    this.state.connect(
      'notificationClosed',
      this.store.select(selectNotificationClosed)
    );
    this.state.connect('user', this.store.select(selectUser));
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.hold(
      this.store.select(selectOnAcceptedInvitation).pipe(
        filter((onAcceptedInvitation) => onAcceptedInvitation),
        take(1)
      ),
      () => {
        this.projectMembersList.animateUser();
      }
    );
  }

  public project$ = this.store.select(selectCurrentProject);

  public invitePeopleModal() {
    this.resetForm = this.invitePeople;
    this.invitePeople = !this.invitePeople;
  }

  public acceptInvitationSlug() {
    this.store.dispatch(
      acceptInvitationSlug({
        slug: this.state.get('project').slug,
      })
    );
  }

  public nextPage() {
    this.store.dispatch(nextMembersPage());
  }
}
