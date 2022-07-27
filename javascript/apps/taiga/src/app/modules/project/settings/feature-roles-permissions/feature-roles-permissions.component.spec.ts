/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import {
  Spectator,
  createComponentFactory,
  SpyObject,
} from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Permissions, ProjectMockFactory, RoleMockFactory } from '@taiga/data';
import { hot } from 'jest-marbles';
import { Observable } from 'rxjs';
import { PermissionsService } from '~/app/services/permissions.service';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import {
  updatePublicPermissions,
  updateRolePermissions,
  updateWorkspacePermissions,
} from './+state/actions/roles-permissions.actions';
import { ProjectSettingsFeatureRolesPermissionsComponent } from './feature-roles-permissions.component';
import { ProjectsSettingsFeatureRolesPermissionsService } from './services/feature-roles-permissions.service';

describe('ProjectSettingsFeatureRolesPermissionsComponent', () => {
  let spectator: Spectator<ProjectSettingsFeatureRolesPermissionsComponent>;
  let projectsSettingsFeatureRolesPermissionsService: SpyObject<ProjectsSettingsFeatureRolesPermissionsService>;
  let actions$: Observable<Action>;
  let permissionsService: SpyObject<PermissionsService>;

  const createComponent = createComponentFactory({
    component: ProjectSettingsFeatureRolesPermissionsComponent,
    imports: [ReactiveFormsModule, RouterTestingModule, getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      provideMockActions(() => actions$),
      provideMockStore({ initialState: {} }),
    ],
    mocks: [ProjectsSettingsFeatureRolesPermissionsService, PermissionsService],
  });

  beforeEach(() => {
    actions$ = hot('-');

    spectator = createComponent({
      props: {},
      providers: [],
      detectChanges: false,
    });

    projectsSettingsFeatureRolesPermissionsService = spectator.inject(
      ProjectsSettingsFeatureRolesPermissionsService
    );

    permissionsService = spectator.inject(PermissionsService);

    projectsSettingsFeatureRolesPermissionsService.getEntities.andReturn(
      new Map([
        ['us', 'Userstories'],
        ['task', 'Tasks'],
        ['sprint', 'Sprints'],
        ['issue', 'Issues'],
        ['epic', 'Epics'],
        ['wiki', 'Wiki'],
      ])
    );

    projectsSettingsFeatureRolesPermissionsService.hasComments.mockReturnValue(
      true
    );
    permissionsService.formatRawPermissions.mockReturnValue({} as any);
  });

  describe('create roles form', () => {
    it('all permissions', () => {
      const role = RoleMockFactory();

      role.permissions = [
        'view_us',
        'add_us',
        'modify_us',
        'delete_us',
        'comment_us',
      ] as Permissions[];

      permissionsService.formatRawPermissions.mockReturnValue({
        us: {
          create: true,
          modify: true,
          delete: true,
          comment: true,
        },
      } as any);

      spectator.component.createRoleFormControl(
        role.permissions,
        role.slug,
        spectator.component.form
      );

      expect(permissionsService.formatRawPermissions).toHaveBeenCalledWith(
        role.permissions
      );

      expect(spectator.component.form.value).toEqual({
        [role.slug]: {
          us: {
            create: true,
            modify: true,
            delete: true,
            comment: true,
          },
        },
      });
    });

    it('no edit permissions', () => {
      const role = RoleMockFactory();

      role.permissions = ['view_us'] as Permissions[];

      permissionsService.formatRawPermissions.andReturn({
        us: {
          create: false,
          modify: false,
          delete: false,
          comment: false,
        },
      });

      spectator.component.createRoleFormControl(
        role.permissions,
        role.slug,
        spectator.component.form
      );

      expect(permissionsService.formatRawPermissions).toHaveBeenCalledWith(
        role.permissions
      );

      expect(spectator.component.form.value).toEqual({
        [role.slug]: {
          us: {
            create: false,
            modify: false,
            delete: false,
            comment: false,
          },
        },
      });
    });

    it('no access', () => {
      const role = RoleMockFactory();

      role.permissions = [] as Permissions[];

      permissionsService.formatRawPermissions.andReturn({});

      spectator.component.createRoleFormControl(
        role.permissions,
        role.slug,
        spectator.component.form
      );

      expect(permissionsService.formatRawPermissions).toHaveBeenCalledWith(
        role.permissions
      );

      expect(spectator.component.form.get(role.slug)?.disabled).toEqual(true);
    });

    it('userstory no access', () => {
      const role = RoleMockFactory();

      role.permissions = ['view_tasks', 'view_sprints'] as Permissions[];

      permissionsService.formatRawPermissions.andReturn({
        task: {
          create: false,
          modify: false,
          delete: false,
          comment: false,
        },
        sprint: {
          create: false,
          modify: false,
          delete: false,
          comment: false,
        },
      });

      spectator.component.createRoleFormControl(
        role.permissions,
        role.slug,
        spectator.component.form
      );

      expect(
        spectator.component.form.get(role.slug)?.get('task')?.disabled
      ).toEqual(true);
      expect(
        spectator.component.form.get(role.slug)?.get('sprint')?.disabled
      ).toEqual(true);
    });
  });

  describe('save', () => {
    it('save members permissions', () => {
      const role = RoleMockFactory();
      role.isAdmin = false;

      const project = ProjectMockFactory();

      const store = spectator.inject(MockStore);
      store.setState({
        rolesPermissions: {
          memberRoles: [role],
        },
        project: {
          projects: { [project.slug]: project },
          currentProjectSlug: project.slug,
        },
      });

      const projectsSettingsFeatureRolesPermissionsService = spectator.inject(
        ProjectsSettingsFeatureRolesPermissionsService
      );

      store.refreshState();
      spectator.detectChanges();

      const finalPermissions = ['view_us'];

      projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions.mockReturnValue(
        finalPermissions
      );

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      spectator.component.saveMembers(role);

      expect(dispatchSpy).toBeCalledWith(
        updateRolePermissions({
          project: project.slug,
          roleSlug: role.slug,
          permissions: finalPermissions,
        })
      );
    });

    it('save public permissions', () => {
      const role = RoleMockFactory();
      const project = ProjectMockFactory();

      const store = spectator.inject(MockStore);
      store.setState({
        rolesPermissions: {
          publicPermissions: role.permissions,
        },
        project: {
          projects: { [project.slug]: project },
          currentProjectSlug: project.slug,
        },
      });

      const projectsSettingsFeatureRolesPermissionsService = spectator.inject(
        ProjectsSettingsFeatureRolesPermissionsService
      );

      store.refreshState();
      spectator.detectChanges();

      const finalPermissions = ['view_us'];

      projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions.mockReturnValue(
        finalPermissions
      );

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      spectator.component.savePublic();

      expect(dispatchSpy).toBeCalledWith(
        updatePublicPermissions({
          project: project.slug,
          permissions: finalPermissions,
        })
      );
    });

    it('save workspace permissions', () => {
      const role = RoleMockFactory();
      const project = ProjectMockFactory();

      const store = spectator.inject(MockStore);
      store.setState({
        rolesPermissions: {
          workspacePermissions: role.permissions,
        },
        project: {
          currentProjectSlug: project.slug,
          projects: { [project.slug]: project },
        },
      });

      const projectsSettingsFeatureRolesPermissionsService = spectator.inject(
        ProjectsSettingsFeatureRolesPermissionsService
      );

      store.refreshState();
      spectator.detectChanges();

      const finalPermissions = ['view_us'];

      projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions.mockReturnValue(
        finalPermissions
      );

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      spectator.component.saveWorkspace();

      expect(dispatchSpy).toBeCalledWith(
        updateWorkspacePermissions({
          project: project.slug,
          permissions: finalPermissions,
        })
      );
    });
  });

  describe('init form', () => {
    it('members', () => {
      const role = RoleMockFactory();
      role.isAdmin = false;
      const store = spectator.inject(MockStore);

      store.setState({
        rolesPermissions: {
          memberRoles: [role],
        },
        project: {
          currentProjectSlug: 'test',
          projects: {},
        },
      });

      store.refreshState();

      const createRoleFormSpy = jest.spyOn(
        spectator.component,
        'createRoleFormControl'
      );

      const watchRoleFormSpy = jest.spyOn(spectator.component, 'watchRoleForm');

      spectator.component.ngOnInit();
      spectator.component.initForm();

      expect(createRoleFormSpy).toHaveBeenCalledWith(
        role.permissions,
        role.slug,
        spectator.component.form
      );
      expect(watchRoleFormSpy).toHaveBeenCalledWith(role);
    });

    it('public permissions', () => {
      const permissions = ['view_us'];
      const store = spectator.inject(MockStore);

      store.setState({
        rolesPermissions: {
          publicPermissions: permissions,
        },
        project: {
          currentProjectSlug: 'test',
          projects: {},
        },
      });

      store.refreshState();

      const createRoleFormSpy = jest.spyOn(
        spectator.component,
        'createRoleFormControl'
      );

      const watchPublicFormSpy = jest.spyOn(
        spectator.component,
        'watchPublicForm'
      );

      spectator.component.ngOnInit();
      spectator.component.initForm();

      expect(createRoleFormSpy).toHaveBeenCalledWith(
        permissions,
        'public',
        spectator.component.publicForm
      );
      expect(watchPublicFormSpy).toHaveBeenCalled();
    });

    it('workspace permissions', () => {
      const permissions = ['view_us'];
      const store = spectator.inject(MockStore);

      store.setState({
        rolesPermissions: {
          workspacePermissions: permissions,
        },
        project: {
          projects: {},
          currentProjectSlug: 'test',
        },
      });

      store.refreshState();

      const createRoleFormSpy = jest.spyOn(
        spectator.component,
        'createRoleFormControl'
      );

      const watchWorkspaceFormSpy = jest.spyOn(
        spectator.component,
        'watchWorkspaceForm'
      );

      spectator.component.ngOnInit();
      spectator.component.initForm();

      expect(createRoleFormSpy).toHaveBeenCalledWith(
        permissions,
        'workspace',
        spectator.component.workspaceForm
      );
      expect(watchWorkspaceFormSpy).toHaveBeenCalled();
    });
  });
});
