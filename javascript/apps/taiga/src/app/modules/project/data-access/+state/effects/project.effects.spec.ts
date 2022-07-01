/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { Observable } from 'rxjs';
import { randDomainSuffix } from '@ngneat/falso';

import { ProjectEffects } from './project.effects';
import { fetchProject, fetchProjectSuccess } from '../actions/project.actions';
import { cold, hot } from 'jest-marbles';
import { ProjectMockFactory, UserMockFactory } from '@taiga/data';
import { TestScheduler } from 'rxjs/testing';
import { acceptInvitationSlugSuccess } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { WsService, WsServiceMock } from '@taiga/ws';

describe('ProjectEffects', () => {
  let actions$: Observable<Action>;
  let spectator: SpectatorService<ProjectEffects>;
  let testScheduler: TestScheduler;

  const createService = createServiceFactory({
    service: ProjectEffects,
    providers: [
      provideMockActions(() => actions$),
      { provide: WsService, useValue: WsServiceMock },
    ],
    mocks: [ProjectApiService, AppService],
  });

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    spectator = createService();
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

      expectObservable(effects.acceptedInvitation$).toBe('2201ms c', {
        c: fetchProject({ slug }),
      });
    });
  });
});
