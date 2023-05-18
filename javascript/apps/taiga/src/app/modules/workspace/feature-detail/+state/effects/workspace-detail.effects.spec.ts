/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { randUuid } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import {
  EmptyWorkspaceAdminMockFactory,
  WorkspaceMembershipMockFactory,
  InvitationWorkspaceMemberMockFactory,
  WorkspaceMockFactory,
  UserMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  workspaceActions,
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';
import {
  selectMembersList,
  selectMembersOffset,
  selectInvitationsOffset,
} from '../selectors/workspace-detail.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/workspace/feature-detail/workspace-feature.constants';
import { TuiNotification } from '@taiga-ui/core';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceDetailEffects>;

  const createService = createServiceFactory({
    service: WorkspaceDetailEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [WorkspaceApiService, AppService, ProjectApiService, Router],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load workspace', () => {
    const id = randUuid();
    const workspace = WorkspaceMockFactory();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    workspaceApiService.fetchWorkspaceDetail.mockReturnValue(
      cold('-b|', { b: workspace })
    );

    actions$ = hot('-a', { a: workspaceActions.fetchWorkspace({ id }) });

    const expected = cold('--a', {
      a: workspaceActions.fetchWorkspaceSuccess({ workspace }),
    });

    expect(effects.loadWorkspace$).toBeObservable(expected);
  });

  it('delete workspace', () => {
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);
    const workspace = EmptyWorkspaceAdminMockFactory();

    workspaceApiService.deleteWorkspace.mockReturnValue(cold('-b|', {}));

    actions$ = hot('-a', {
      a: workspaceActions.deleteWorkspace({
        id: workspace.id,
        name: workspace.name,
      }),
    });

    const expected = cold('--a', {
      a: workspaceActions.deleteWorkspaceSuccess({
        id: workspace.id,
        name: workspace.name,
      }),
    });

    expect(effects.deleteWorkspace$).toBeObservable(expected);
  });

  it('load workspace people', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    const membersResponse = {
      members: [
        WorkspaceMembershipMockFactory(),
        WorkspaceMembershipMockFactory(),
      ],
      totalMembers: 2,
    };

    const nonMembersResponse = {
      members: [
        WorkspaceMembershipMockFactory(),
        WorkspaceMembershipMockFactory(),
      ],
      totalMembers: 2,
    };

    const invitations = {
      members: [
        InvitationWorkspaceMemberMockFactory(),
        InvitationWorkspaceMemberMockFactory(),
      ],
      totalMembers: 2,
    };

    workspaceApiService.getWorkspaceMembers.mockReturnValue(
      cold('-b|', { b: membersResponse })
    );
    workspaceApiService.getWorkspaceNonMembers.mockReturnValue(
      cold('-b|', { b: nonMembersResponse })
    );
    workspaceApiService.getWorkspaceInvitationMembers.mockReturnValue(
      cold('-b|', { b: invitations })
    );

    actions$ = hot('-a', {
      a: workspaceDetailApiActions.initWorkspacePeople({ id }),
    });

    const expected = cold('--a', {
      a: workspaceDetailApiActions.initWorkspacePeopleSuccess({
        members: {
          members: membersResponse.members,
          totalMembers: 2,
          offset: 0,
        },
        nonMembers: {
          members: nonMembersResponse.members,
          totalMembers: 2,
          offset: 0,
        },
        invitations: {
          members: invitations.members,
          totalMembers: 2,
          offset: 0,
        },
      }),
    });

    expect(effects.initWorkspacePeople$).toBeObservable(expected);
  });

  it('shoud go to the previous page if no members are left', () => {
    const effects = spectator.inject(WorkspaceDetailEffects);

    const workspace = WorkspaceMockFactory();
    const member = WorkspaceMembershipMockFactory();
    const offset = 40;

    actions$ = hot('-a', {
      a: workspaceDetailApiActions.removeMemberSuccess({
        id: workspace.id,
        member: member.user.username,
      }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectMembersList, []);
    store.overrideSelector(selectMembersOffset, offset);
    store.refreshState();

    const expected = cold('-a', {
      a: workspaceDetailApiActions.getWorkspaceMembers({
        id: workspace.id,
        offset: offset - MEMBERS_PAGE_SIZE,
        showLoading: false,
      }),
    });

    expect(effects.removeMemberSuccessChangeReloadPage$).toBeObservable(
      expected
    );
  });

  it('load workspace members', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    const membersResponse = {
      members: [
        WorkspaceMembershipMockFactory(),
        WorkspaceMembershipMockFactory(),
      ],
      totalMembers: 2,
    };

    workspaceApiService.getWorkspaceMembers.mockReturnValue(
      cold('-b|', { b: membersResponse })
    );

    actions$ = hot('-a', {
      a: workspaceDetailApiActions.getWorkspaceMembers({
        id,
        offset: 0,
        showLoading: true,
      }),
    });

    const expected = cold('--a', {
      a: workspaceDetailApiActions.getWorkspaceMembersSuccess({
        members: membersResponse.members,
        totalMembers: 2,
        offset: 0,
      }),
    });

    expect(effects.loadWorkspaceMembers$).toBeObservable(expected);
  });

  it('load workspace non members', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    const nonMembersResponse = {
      members: [
        WorkspaceMembershipMockFactory(),
        WorkspaceMembershipMockFactory(),
      ],
      totalMembers: 2,
    };

    workspaceApiService.getWorkspaceNonMembers.mockReturnValue(
      cold('-b|', { b: nonMembersResponse })
    );

    actions$ = hot('-a', {
      a: workspaceDetailApiActions.getWorkspaceNonMembers({ id, offset: 0 }),
    });

    const expected = cold('--a', {
      a: workspaceDetailApiActions.getWorkspaceNonMembersSuccess({
        members: nonMembersResponse.members,
        totalMembers: 2,
        offset: 0,
      }),
    });

    expect(effects.loadWorkspaceNonMembers$).toBeObservable(expected);
  });

  it('load workspace invitations', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    const invitationsResponse = {
      members: [
        InvitationWorkspaceMemberMockFactory(),
        InvitationWorkspaceMemberMockFactory(),
      ],
      totalMembers: 2,
    };

    workspaceApiService.getWorkspaceInvitationMembers.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', {
      a: workspaceDetailApiActions.getWorkspaceMemberInvitations({
        id,
        offset: 0,
      }),
    });

    const expected = cold('--a', {
      a: workspaceDetailApiActions.getWorkspaceMemberInvitationsSuccess({
        members: invitationsResponse.members,
        totalMembers: 2,
        offset: 0,
      }),
    });

    expect(effects.loadWorkspaceMemberInvitations$).toBeObservable(expected);
  });

  it('update workspace members and invitations', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailEffects);

    const membersResponse = {
      members: [
        WorkspaceMembershipMockFactory(),
        WorkspaceMembershipMockFactory(),
      ],
      totalMembers: 2,
    };

    const invitations = {
      members: [
        InvitationWorkspaceMemberMockFactory(),
        InvitationWorkspaceMemberMockFactory(),
      ],
      totalMembers: 2,
    };

    workspaceApiService.getWorkspaceMembers.mockReturnValue(
      cold('-b|', { b: membersResponse })
    );
    workspaceApiService.getWorkspaceInvitationMembers.mockReturnValue(
      cold('-b|', { b: invitations })
    );

    actions$ = hot('-a', {
      a: workspaceDetailEventActions.updateMembersList({ id }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectInvitationsOffset, 0);
    store.overrideSelector(selectMembersOffset, 0);
    store.refreshState();

    const expected = cold('--a', {
      a: workspaceDetailEventActions.updateMembersListSuccess({
        members: {
          members: membersResponse.members,
          totalMembers: 2,
          offset: 0,
        },
        invitations: {
          members: invitations.members,
          totalMembers: 2,
          offset: 0,
        },
      }),
    });

    expect(effects.updateWorkspaceMembersInvitations$).toBeObservable(expected);
  });

  it('should leave workspace successfully', () => {
    const user = UserMockFactory();
    const workspace = WorkspaceMockFactory();

    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const action = workspaceActions.leaveWorkspace({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });
    const effects = spectator.inject(WorkspaceDetailEffects);
    const outcome = workspaceActions.leaveWorkspaceSuccess({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });

    actions$ = hot('-a', { a: action });
    const response = cold('-a|', { a: {} });
    const expected = cold('--b', { b: outcome });

    workspaceApiService.removeWorkspaceMember.mockReturnValue(response);

    expect(effects.leaveWorkspace$).toBeObservable(expected);
  });

  it('should show message & redirect on leave workspace', () => {
    const user = UserMockFactory();
    const workspace = WorkspaceMockFactory();

    const action = workspaceActions.leaveWorkspaceSuccess({
      id: workspace.id,
      username: user.username,
      name: workspace.name,
    });
    const effects = spectator.inject(WorkspaceDetailEffects);
    const appService = spectator.inject(AppService);
    const router = spectator.inject(Router);

    actions$ = hot('-a', { a: action });

    expect(effects.leaveWorkspaceSucces$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalledWith({
        message: 'workspace.people.remove.no_longer_member',
        paramsMessage: { workspace: action.name },
        status: TuiNotification.Info,
        closeOnNavigation: false,
        autoClose: true,
      });

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
