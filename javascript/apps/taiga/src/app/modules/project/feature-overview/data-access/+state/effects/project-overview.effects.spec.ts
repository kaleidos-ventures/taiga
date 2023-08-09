/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Location } from '@angular/common';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ProjectApiService } from '@taiga/api';
import { InvitationMockFactory, ProjectMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  editProject,
  editProjectSuccess,
  fetchInvitationsSuccess,
  initMembers,
} from '../actions/project-overview.actions';
import { ProjectOverviewEffects } from './project-overview.effects';

describe('ProjectOverviewEffects', () => {
  let actions$: Observable<Action>;
  let store: MockStore;
  let spectator: SpectatorService<ProjectOverviewEffects>;

  const initialState = {
    overview: {
      members: [],
      invitations: [],
      totalInvitations: 0,
      totalMemberships: 0,
      hasMoreMembers: true,
      hasMoreInvitations: true,
      showAllMembers: false,
    },
  };

  const createService = createServiceFactory({
    service: ProjectOverviewEffects,
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({
        initialState,
      }),
    ],
    imports: [getTranslocoModule()],
    mocks: [ProjectApiService, Location, AppService],
  });

  beforeEach(() => {
    spectator = createService();
    store = spectator.inject(MockStore);
  });

  it('init members', () => {
    const project = ProjectMockFactory();

    project.userIsAdmin = true;

    store.overrideSelector(selectCurrentProject, project);

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectOverviewEffects);

    const invitationsResponse = {
      invitations: [InvitationMockFactory(), InvitationMockFactory()],
    };

    projectApiService.getInvitations.mockReturnValue(
      cold('-b|', { b: invitationsResponse })
    );

    actions$ = hot('-a', { a: initMembers() });

    const expected = cold('--a', {
      a: fetchInvitationsSuccess({
        invitations: invitationsResponse.invitations,
      }),
    });

    expect(effects.initMembers$).toBeObservable(expected);
    expect(effects.initMembers$).toSatisfyOnFlush(() => {
      expect(projectApiService.getInvitations).toHaveBeenCalledWith(project.id);
    });
  });

  it('Project edit - success', () => {
    const project = ProjectMockFactory();
    const effects = spectator.inject(ProjectOverviewEffects);
    const projectApiService = spectator.inject(ProjectApiService);

    projectApiService.editProject.mockReturnValue(cold('-b|', { b: project }));

    actions$ = hot('-a', {
      a: editProject({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
        },
      }),
    });

    const expected = cold('--a', {
      a: editProjectSuccess({ project }),
    });

    expect(effects.formUpdateProject$).toBeObservable(expected);
  });

  it('Project edit - error', () => {
    const project = ProjectMockFactory();
    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectOverviewEffects);
    const appService = spectator.inject(AppService);

    projectApiService.editProject
      .mockReturnValueOnce(
        cold(
          '-#|',
          {},
          {
            status: 403,
          }
        )
      )
      .mockReturnValueOnce(
        cold(
          '-#|',
          {},
          {
            status: 400,
          }
        )
      );

    const editProjectMock = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
      },
    };

    actions$ = hot('-a--b', {
      a: editProject(editProjectMock),
      b: editProject(editProjectMock),
    });

    expect(effects.formUpdateProject$).toSatisfyOnFlush(() => {
      expect(appService.toastNotification).toHaveBeenCalled();
      expect(appService.toastSaveChangesError).toHaveBeenCalledWith({
        status: 400,
      });
    });
  });
});
