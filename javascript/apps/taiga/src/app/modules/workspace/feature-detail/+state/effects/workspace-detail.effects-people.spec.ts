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
  WorkspaceMembershipMockFactory,
  InvitationWorkspaceMemberMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  workspaceDetailApiActions,
  workspaceDetailEventActions,
} from '../actions/workspace-detail.actions';
import {
  selectInvitationsList,
  selectNonMembersList,
  selectMembersOffset,
  selectInvitationsOffset,
  selectNonMembersOffset,
} from '../selectors/workspace-detail.selectors';
import { WorkspaceDetailPeopleEffects } from './workspace-detail-people.effects';

describe('WorkspaceEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<WorkspaceDetailPeopleEffects>;

  const createService = createServiceFactory({
    service: WorkspaceDetailPeopleEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [WorkspaceApiService, AppService, ProjectApiService, Router],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('load workspace people', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
        },
        nonMembers: {
          members: nonMembersResponse.members,
          totalMembers: 2,
          offset: 0,
        },
        invitations: {
          members: invitations.members,
          totalMembers: 2,
        },
      }),
    });

    expect(effects.initWorkspacePeople$).toBeObservable(expected);
  });

  it('load workspace members', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
        showLoading: true,
      }),
    });

    const expected = cold('--a', {
      a: workspaceDetailApiActions.getWorkspaceMembersSuccess({
        members: membersResponse.members,
        totalMembers: 2,
      }),
    });

    expect(effects.loadWorkspaceMembers$).toBeObservable(expected);
  });

  it('load workspace non members', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
      a: workspaceDetailEventActions.updateMembersInvitationsList({ id }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectInvitationsList, invitations.members);
    store.overrideSelector(selectInvitationsOffset, 0);
    store.overrideSelector(selectMembersOffset, 0);
    store.refreshState();

    const expected = cold('--a', {
      a: workspaceDetailEventActions.updateMembersInvitationsListSuccess({
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

  it('update workspace non members and invitations', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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

    workspaceApiService.getWorkspaceNonMembers.mockReturnValue(
      cold('-b|', { b: nonMembersResponse })
    );
    workspaceApiService.getWorkspaceInvitationMembers.mockReturnValue(
      cold('-b|', { b: invitations })
    );

    actions$ = hot('-a', {
      a: workspaceDetailEventActions.updateNonMembersInvitationsList({ id }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectNonMembersList, nonMembersResponse.members);
    store.overrideSelector(selectInvitationsOffset, 0);
    store.overrideSelector(selectNonMembersOffset, 0);
    store.refreshState();

    const expected = cold('--a', {
      a: workspaceDetailEventActions.updateNonMembersInvitationsListSuccess({
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

    expect(effects.updateWorkspaceInvitationsAndNonMembers$).toBeObservable(
      expected
    );
  });

  it('update workspace members and non members', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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

    workspaceApiService.getWorkspaceNonMembers.mockReturnValue(
      cold('-b|', { b: nonMembersResponse })
    );
    workspaceApiService.getWorkspaceMembers.mockReturnValue(
      cold('-b|', { b: membersResponse })
    );

    actions$ = hot('-a', {
      a: workspaceDetailEventActions.updateMembersNonMembersProjects({ id }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectMembersOffset, 0);
    store.overrideSelector(selectNonMembersOffset, 0);
    store.refreshState();

    const expected = cold('--a', {
      a: workspaceDetailEventActions.updateMembersNonMembersProjectsSuccess({
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
      }),
    });

    expect(effects.updateMembersNonMembersProjects$).toBeObservable(expected);
  });

  it('update workspace invitations', () => {
    const id = randUuid();
    const workspaceApiService = spectator.inject(WorkspaceApiService);
    const effects = spectator.inject(WorkspaceDetailPeopleEffects);

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
      a: workspaceDetailEventActions.updateInvitationsList({ id }),
    });

    const store = spectator.inject(MockStore);
    store.overrideSelector(selectNonMembersOffset, 0);
    store.refreshState();

    const expected = cold('--a', {
      a: workspaceDetailEventActions.updateInvitationsListSuccess({
        members: invitationsResponse.members,
        totalMembers: 2,
        offset: 0,
      }),
    });

    expect(effects.updateInvitationsMembersList$).toBeObservable(expected);
  });
});
