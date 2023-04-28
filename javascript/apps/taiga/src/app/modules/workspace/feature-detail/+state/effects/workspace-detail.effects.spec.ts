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
import { provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService, WorkspaceApiService } from '@taiga/api';
import {
  EmptyWorkspaceAdminMockFactory,
  WorkspaceMembershipMockFactory,
  InvitationWorkspaceMemberMockFactory,
  WorkspaceMockFactory,
} from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import {
  workspaceActions,
  workspaceDetailApiActions,
} from '../actions/workspace-detail.actions';
import { WorkspaceDetailEffects } from './workspace-detail.effects';

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
});
