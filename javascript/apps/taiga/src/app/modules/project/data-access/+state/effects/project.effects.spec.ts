/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { randDomainSuffix } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { Observable } from 'rxjs';
import { AppService } from '~/app/services/app.service';

import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectMockFactory, UserMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { TestScheduler } from 'rxjs/testing';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { WsService, WsServiceMock } from '~/app/services/ws';
import { acceptInvitationSlugSuccess } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { fetchProject, fetchProjectSuccess } from '../actions/project.actions';
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
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);

    projectApiService.getProject.mockReturnValue(cold('-b|', { b: project }));

    actions$ = hot('-a', { a: fetchProject({ slug }) });

    const expected = cold('--a', {
      a: fetchProjectSuccess({ project }),
    });

    expect(effects.loadProject$).toBeObservable(expected);
  });

  it('Accepted Invitation', () => {
    const slug = randDomainSuffix({ length: 3 }).join('-');
    const user = UserMockFactory();
    const username = user.username;
    const effects = spectator.inject(ProjectEffects);

    actions$ = hot('-a', {
      a: acceptInvitationSlugSuccess({ projectSlug: slug, username }),
    });

    testScheduler.run((helpers) => {
      const { hot, expectObservable } = helpers;
      actions$ = hot('-a', {
        a: acceptInvitationSlugSuccess({ projectSlug: slug, username }),
      });

      expectObservable(effects.acceptedInvitation$).toBe('-c', {
        c: fetchProject({ slug }),
      });
    });
  });
});
