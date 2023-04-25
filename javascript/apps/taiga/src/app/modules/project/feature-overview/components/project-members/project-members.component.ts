/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiLinkModule, TuiSvgModule } from '@taiga-ui/core';
import { Invitation, Membership, Project, User } from '@taiga/data';
import { ModalModule } from '@taiga/ui/modal';
import { SkeletonsModule } from '@taiga/ui/skeletons/skeletons.module';
import { Subject } from 'rxjs';
import { delay, distinctUntilChanged, map, take } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import {
  initMembers,
  nextMembersPage,
  updateMembersList,
  updateShowAllMembers,
} from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import {
  selectHasMoreMembers,
  selectInvitations,
  selectInvitationsToAnimate,
  selectMembers,
  selectMembersToAnimate,
  selectNotificationClosed,
  selectShowAllMembers,
  selectTotalInvitations,
  selectTotalMemberships,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';
import { WaitingForToastNotification } from '~/app/modules/project/feature-overview/project-feature-overview.animation-timing';
import { WsService } from '~/app/services/ws';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import { InviteUserModalModule } from '~/app/shared/invite-user-modal/invite-user-modal.module';
import { filterNil } from '~/app/shared/utils/operators';
import { ProjectMembersListComponent } from '../project-members-list/project-members-list.component';
import { ProjectMembersModalComponent } from '../project-members-modal/project-members-modal.component';

@UntilDestroy()
@Component({
  selector: 'tg-project-members',
  standalone: true,
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_overview',
        alias: 'project_overview',
      },
    },
  ],
  imports: [
    TuiSvgModule,
    CommonTemplateModule,
    TuiLinkModule,
    ModalModule,
    ProjectMembersModalComponent,
    SkeletonsModule,
    ProjectMembersListComponent,
    InviteUserModalModule,
  ],
})
export class ProjectMembersComponent {
  @ViewChild(ProjectMembersListComponent)
  public projectMembersList!: ProjectMembersListComponent;

  public readonly model$ = this.state.select().pipe(
    map((state) => {
      if (state.hasMoreMembers) {
        state.invitations = [];
      }
      const membersAndInvitations = [
        ...state.members,
        ...state.invitations.filter(
          (invitation) => invitation.email !== state.user?.email
        ),
      ].filter((member) => {
        return member?.user?.username !== state.user?.username;
      });

      const currentMember = this.getCurrentUserMembership();

      if (currentMember) {
        membersAndInvitations.unshift(currentMember);
      }

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
  public unsubscribe$ = new Subject<void>();

  constructor(
    private actions$: Actions,
    private store: Store,
    private state: RxState<{
      project: Project;
      members: Membership[];
      invitations: Invitation[];
      notificationClosed: boolean;
      user: User | null;
      totalMemberships: number;
      totalInvitations: number;
      hasMoreMembers: boolean;
      showAllMembers: boolean;
      invitationsToAnimate: string[];
      membersToAnimate: string[];
    }>,
    private wsService: WsService
  ) {
    this.state.hold(
      this.state
        .select('project')
        .pipe(distinctUntilChanged((prev, curr) => prev.id === curr.id)),
      () => {
        this.store.dispatch(initMembers());
      }
    );

    this.state.connect(
      'hasMoreMembers',
      this.store.select(selectHasMoreMembers)
    );

    this.state.connect(
      'showAllMembers',
      this.store.select(selectShowAllMembers)
    );

    this.state.connect(
      'invitationsToAnimate',
      this.store.select(selectInvitationsToAnimate)
    );

    this.state.connect(
      'membersToAnimate',
      this.store.select(selectMembersToAnimate)
    );

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

    const invitationAccepted = this.actions$.pipe(
      ofType(invitationProjectActions.acceptInvitationIdSuccess),
      delay(WaitingForToastNotification),
      take(1)
    );

    this.state.hold(invitationAccepted, () => {
      this.projectMembersList.animateUser();
    });

    const updateList = this.actions$.pipe(ofType(updateMembersList));

    this.state.hold(updateList, () => {
      this.projectMembersList.animateUser();
    });

    this.actions$
      .pipe(ofType(invitationProjectActions.inviteUsersSuccess))
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.projectMembersList.animateUser();
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(ProjectOverviewActions.updateMembersList());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.create',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(ProjectOverviewActions.updateMembersList());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(ProjectOverviewActions.updateMembersList());
      });

    this.wsService
      .events<{ project: string }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectinvitations.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(ProjectOverviewActions.updateMembersList());
      });

    this.wsService
      .events<{ membership: Membership }>({
        channel: `projects.${this.state.get('project').id}`,
        type: 'projectmemberships.update',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(ProjectOverviewActions.updateMembersInfo());
      });
  }

  public project$ = this.store.select(selectCurrentProject);

  public invitePeopleModal() {
    this.resetForm = this.invitePeople;
    this.invitePeople = !this.invitePeople;
  }

  public getCurrentUserMembership(): Invitation | Membership | undefined {
    const user = this.state.get('user');
    const project = this.state.get('project');
    let currentMember: Invitation | Membership | undefined;

    if (user && (project.userIsMember || project.userHasPendingInvitation)) {
      currentMember = {
        user: {
          username: user.username,
          fullName: user.fullName,
          color: user.color,
        },
        role: {
          isAdmin: project.userIsAdmin,
        },
      };

      if (project.userHasPendingInvitation) {
        (currentMember as Invitation).email = user.email;
      }
    }

    return currentMember;
  }

  public setShowAllMembers(showAllMembers: boolean) {
    this.store.dispatch(
      updateShowAllMembers({
        showAllMembers: showAllMembers,
      })
    );
  }

  public acceptInvitationId() {
    this.store.dispatch(
      invitationProjectActions.acceptInvitationId({
        id: this.state.get('project').id,
      })
    );
  }

  public nextPage() {
    this.store.dispatch(nextMembersPage());
  }

  public onInviteSuccess() {
    this.store.dispatch(ProjectOverviewActions.initMembers());
  }
}
