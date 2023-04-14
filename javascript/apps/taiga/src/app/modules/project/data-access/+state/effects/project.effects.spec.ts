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
import { ProjectApiService } from '@taiga/api';
import { ProjectMockFactory, UserMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { AppService } from '~/app/services/app.service';
import { WsService, WsServiceMock } from '~/app/services/ws';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import {
  fetchProject,
  fetchProjectSuccess,
  permissionsUpdate,
  permissionsUpdateSuccess,
} from '../actions/project.actions';
import { ProjectEffects } from './project.effects';

describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectEffects>;
  let testScheduler: TestScheduler;
  let store: MockStore;

  const createService = createServiceFactory({
    service: ProjectEffects,
    providers: [
      provideMockActions(() => actions$),
      { provide: WsService, useValue: WsServiceMock },
      provideMockStore({ initialState: {} }),
    ],
    mocks: [ProjectApiService, AppService, Router],
  });

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    spectator = createService();
    store = spectator.inject(MockStore);
    const user = UserMockFactory();
    store.overrideSelector(selectUser, user);
  });

  it('load project', () => {
    const id = randUuid();
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getProject.mockReturnValue(cold('-b|', { b: project }));

    actions$ = hot('-a', { a: fetchProject({ id }) });

    const expected = cold('--a', {
      a: fetchProjectSuccess({ project }),
    });

    expect(effects.loadProject$).toBeObservable(expected);
  });

  it('Accepted Invitation', () => {
    const id = randUuid();
    const user = UserMockFactory();
    const username = user.username;
    const effects = spectator.inject(ProjectEffects);

    actions$ = hot('-a', {
      a: invitationProjectActions.acceptInvitationIdSuccess({
        projectId: id,
        username,
      }),
    });

    testScheduler.run((helpers) => {
      const { hot, expectObservable } = helpers;
      actions$ = hot('-a', {
        a: invitationProjectActions.acceptInvitationIdSuccess({
          projectId: id,
          username,
        }),
      });

      expectObservable(effects.acceptedInvitation$).toBe('-c', {
        c: fetchProject({ id }),
      });
    });
  });

  it('Permissions update - success', () => {
    const id = randUuid();
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getProject.mockReturnValue(cold('-b|', { b: project }));

    actions$ = hot('-a', { a: permissionsUpdate({ id }) });

    const expected = cold('--a', {
      a: permissionsUpdateSuccess({ project }),
    });

    expect(effects.permissionsUpdate$).toBeObservable(expected);
  });

  it('Permissions update - error', () => {
    const id = randUuid();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);
    const router = spectator.inject(Router);
    const appService = spectator.inject(AppService);

    projectApiService.getProject.mockReturnValue(
      cold(
        '-#|',
        {},
        {
          status: 403,
        }
      )
    );

    actions$ = hot('-a', { a: permissionsUpdate({ id }) });

    expect(effects.permissionsUpdate$).toSatisfyOnFlush(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(appService.errorManagement).toHaveBeenCalled();
    });
  });
});
