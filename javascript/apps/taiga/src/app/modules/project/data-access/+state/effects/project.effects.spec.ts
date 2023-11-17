/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ActivatedRoute, Router } from '@angular/router';
import { randUuid, randCompanyName } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import {
  ProjectMockFactory,
  UserMockFactory,
  WorkflowMockFactory,
} from '@taiga/data';
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
  updateWorkflow,
  projectApiActions,
  deleteWorkflow,
} from '../actions/project.actions';
import { selectCurrentProject } from '../selectors/project.selectors';
import { ProjectEffects } from './project.effects';
import { HttpErrorResponse } from '@angular/common/http';
import { selectRouteParams } from '~/app/router-selectors';
import { Location } from '@angular/common';

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
      {
        provide: Router,
        useValue: { navigate: jest.fn(), url: '/some-url/kanban/old-slug' },
      },
    ],
    mocks: [ProjectApiService, AppService, ActivatedRoute, Location],
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

    it('update workflow', () => {
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(ProjectEffects);
      const workflow = WorkflowMockFactory();
      const newWorkflowName = randCompanyName();
      const workflowSuccess = {
        ...workflow,
        name: newWorkflowName,
      };

      projectApiService.updateWorkflow.mockReturnValue(
        cold('-b|', { b: workflowSuccess })
      );

      actions$ = hot('-a', {
        a: updateWorkflow({
          name: newWorkflowName,
          slug: workflow.slug,
        }),
      });

      const expected = cold('--a', {
        a: projectApiActions.updateWorkflowSuccess({
          workflow: workflowSuccess,
        }),
      });

      expect(effects.updateWorkflow$).toBeObservable(expected);
    });

    it('should update workflow slug in the URL', () => {
      const workflow = WorkflowMockFactory();
      const location = spectator.inject(Location);
      const effects = spectator.inject(ProjectEffects);

      const action = projectEventActions.updateWorkflow({
        workflow: workflow,
      });

      actions$ = hot('-a', { a: action });

      const params = { workflow: 'old-slug' };
      store.overrideSelector(selectRouteParams, params);

      expect(effects.updateWorkflowSlug$).toSatisfyOnFlush(() => {
        expect(location.go).toHaveBeenCalledWith(
          `/some-url/kanban/${workflow.slug}`
        );
      });
    });

    it('fetch project workflow', () => {
      const project = ProjectMockFactory();
      const projectApiService = spectator.inject(ProjectApiService);
      const effects = spectator.inject(ProjectEffects);
      const workflow = WorkflowMockFactory(3);

      store.overrideSelector(selectCurrentProject, project);

      projectApiService.getWorkflow.mockReturnValue(
        cold('-b|', { b: workflow })
      );

      actions$ = hot('-a', {
        a: projectApiActions.fetchWorkflow({ workflow: workflow.slug }),
      });

      const expected = cold('--a', {
        a: projectApiActions.fetchWorkflowSuccess({ workflow }),
      });

      expect(effects.loadWorkflows$).toBeObservable(expected);
    });
  });

  it('deleteWorkflow$', () => {
    const workflow = WorkflowMockFactory();
    const workflow2 = WorkflowMockFactory();
    const project = ProjectMockFactory();

    project.workflows = [workflow, workflow2];

    const workflowRenameResult = {
      ...workflow2,
      slug: 'new-slug',
    };

    const projectApiService = spectator.inject(ProjectApiService);
    const effects = spectator.inject(ProjectEffects);
    const router = spectator.inject(Router);

    const workflowRename$ = cold('-c', { c: workflowRenameResult });
    const deleteWorkflow$ = cold('-d', { d: null });

    store.overrideSelector(selectCurrentProject, project);
    projectApiService.updateWorkflow.mockReturnValue(workflowRename$);
    projectApiService.deleteWorkflow.mockReturnValue(deleteWorkflow$);

    const action = deleteWorkflow({ workflow });

    actions$ = hot('-a', { a: action });

    expect(effects.deleteWorkflow$).toSatisfyOnFlush(() => {
      expect(projectApiService.updateWorkflow).toHaveBeenCalledWith(
        'Main',
        workflow2.slug,
        project.id
      );

      expect(projectApiService.deleteWorkflow).toHaveBeenCalledWith(
        project.id,
        workflow.slug,
        undefined
      );
      const expected = cold('--a', {
        a: projectApiActions.deleteWorkflowSuccess({ workflow }),
      });

      expect(effects.deleteWorkflow$).toBeObservable(expected);

      expect(router.navigate).toHaveBeenCalledWith([
        `project/${project.id}/${project.slug}/kanban/${workflowRenameResult.slug}`,
      ]);
    });
  });
});
