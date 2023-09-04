/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Router } from '@angular/router';
import { randUuid, randCompanyName } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { ProjectMockFactory, UserMockFactory } from '@taiga/data';
import { cold, hot } from 'jest-marbles';
import { Observable, of } from 'rxjs';
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
  projectEventActions,
  leaveProject,
  leaveProjectSuccess,
} from '../actions/project.actions';
import { selectCurrentProject } from '../selectors/project.selectors';
import { ProjectEffects } from './project.effects';
import { HttpErrorResponse } from '@angular/common/http';

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
    const projectName = randCompanyName();
    const user = UserMockFactory();
    const username = user.username;
    const effects = spectator.inject(ProjectEffects);

    actions$ = hot('-a', {
      a: invitationProjectActions.acceptInvitationIdSuccess({
        projectId: id,
        projectName,
        username,
      }),
    });

    testScheduler.run((helpers) => {
      const { hot, expectObservable } = helpers;
      actions$ = hot('-a', {
        a: invitationProjectActions.acceptInvitationIdSuccess({
          projectId: id,
          projectName,
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

  it('should handle userLostProjectMembership effect when triggered', () => {
    const projectSlug = 'test-project';
    const projectMock = ProjectMockFactory();
    const projectName = projectMock.name;
    const projectId = projectMock.id;
    const projectApiService = spectator.inject(ProjectApiService);
    const router = spectator.inject(Router);
    const appService = spectator.inject(AppService);
    const effects = spectator.inject(ProjectEffects);
    const store = spectator.inject(MockStore);

    projectApiService.getProject.mockReturnValue(of(projectMock));
    store.overrideSelector(selectCurrentProject, projectMock);

    actions$ = hot('-a', {
      a: projectEventActions.userLostProjectMembership({
        isSelf: true,
        projectName,
        username: 'test-user',
      }),
    });

    const expected = cold('--a', {
      a: fetchProjectSuccess({ project: projectMock }),
    });

    effects.userLostProjectMembership$.subscribe(() => {
      expect(appService.toastNotification).toHaveBeenCalledWith({
        message: 'common_members_tabs.no_longer_member',
        paramsMessage: { name: projectName, type: 'project' },
        status: TuiNotification.Info,
        closeOnNavigation: false,
        autoClose: true,
      });
      expect(router.navigate).toHaveBeenCalledWith([
        'project',
        projectId,
        projectSlug,
      ]);

      expect(effects.userLostProjectMembership$).toBeObservable(expected);
    });
  });

  describe('leaveProject$', () => {
    it('leave project and user has view permissions', () => {
      const project = ProjectMockFactory();
      const projectApiService = spectator.inject(ProjectApiService);
      const action = leaveProject(project);
      const effects = spectator.inject(ProjectEffects);
      const outcome = leaveProjectSuccess({
        id: project.id,
        name: project.name,
        refreshProject: project,
      });

      actions$ = hot('-a', { a: action });
      const response = cold('-a|', { a: project });
      const expected = cold('--b', { b: outcome });

      projectApiService.deleteProjectMembership.mockReturnValue(of(undefined));
      projectApiService.getProject.mockReturnValue(response);

      expect(effects.leaveProject$).toBeObservable(expected);
    });

    it('leave project and user has not view permissions', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const project = ProjectMockFactory();
      const action = leaveProject(project);
      const effects = spectator.inject(ProjectEffects);
      const outcome = leaveProjectSuccess({
        id: project.id,
        name: project.name,
        refreshProject: null,
      });
      const error = new HttpErrorResponse({});

      actions$ = hot('-a', { a: action });
      const fail = cold('-#|', {}, error);
      const expected = cold('--b', { b: outcome });

      projectApiService.deleteProjectMembership.mockReturnValue(of(undefined));
      projectApiService.getProject.mockReturnValue(fail);

      expect(effects.leaveProject$).toBeObservable(expected);
    });
  });

  describe('leaveProjectSuccess$', () => {
    it('show message & refresh project if the user has access', () => {
      const project = ProjectMockFactory();
      const action = leaveProjectSuccess({
        id: project.id,
        name: project.name,
        refreshProject: project,
      });
      const outcome = fetchProjectSuccess({ project });
      const effects = spectator.inject(ProjectEffects);
      const appService = spectator.inject(AppService);

      actions$ = hot('-a', { a: action });
      const expected = hot('-b', { b: outcome });

      expect(effects.leaveProjectSucces$).toSatisfyOnFlush(() => {
        expect(effects.leaveProjectSucces$).toBeObservable(expected);

        expect(appService.toastNotification).toHaveBeenCalledWith({
          message: 'project.leave_project.no_longer_member',
          paramsMessage: { project: action.name },
          status: TuiNotification.Info,
          closeOnNavigation: false,
          autoClose: true,
        });
      });
    });

    it('show message & redirect if the user has not access', () => {
      const project = ProjectMockFactory();
      const action = leaveProjectSuccess({
        id: project.id,
        name: project.name,
        refreshProject: null,
      });

      actions$ = hot('-a', { a: action });
      const expected = hot('-(b|)', { b: [] });
      const effects = spectator.inject(ProjectEffects);
      const appService = spectator.inject(AppService);
      const router = spectator.inject(Router);

      expect(effects.leaveProjectSucces$).toSatisfyOnFlush(() => {
        expect(effects.leaveProjectSucces$).toBeObservable(expected);
        expect(appService.toastNotification).toHaveBeenCalledWith({
          message: 'project.leave_project.no_longer_member',
          paramsMessage: { project: action.name },
          status: TuiNotification.Info,
          closeOnNavigation: false,
          autoClose: true,
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
      });
    });
  });
});
