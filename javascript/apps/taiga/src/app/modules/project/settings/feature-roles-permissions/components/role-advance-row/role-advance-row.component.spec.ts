/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { KeyValue } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  createComponentFactory,
  Spectator,
  SpyObject,
} from '@ngneat/spectator/jest';
import { SettingsPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/settings-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';

import { RoleAdvanceRowComponent } from './role-advance-row.component';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

describe('RoleAdvanceRowComponent', () => {
  let spectator: Spectator<RoleAdvanceRowComponent>;
  let projectsSettingsFeatureRolesPermissionsService: SpyObject<ProjectsSettingsFeatureRolesPermissionsService>;

  const createComponent = createComponentFactory({
    component: RoleAdvanceRowComponent,
    imports: [getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [],
    mocks: [ProjectsSettingsFeatureRolesPermissionsService],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {},
      providers: [],
      detectChanges: false,
    });

    projectsSettingsFeatureRolesPermissionsService = spectator.inject(
      ProjectsSettingsFeatureRolesPermissionsService
    );

    spectator.component.basicPermissionList = new Map([
      ['no_access', 'No access'],
      ['view', 'View'],
      ['edit', 'Edit'],
    ]);
  });

  it('refresh permission', () => {
    spectator.component.formGroup = new FormGroup({});

    projectsSettingsFeatureRolesPermissionsService.formPermissionState.mockReturnValue(
      'edit'
    );

    spectator.component.refreshPermission();

    expect(spectator.component.permissionRowModel.key).toBe('edit');
    expect(spectator.component.permissionRowModel.value).toBe('Edit');

    expect(spectator.component.previousPermission).toEqual(
      spectator.component.permissionRowModel
    );
  });

  it('permission change', () => {
    spectator.component.formGroup = new FormGroup({
      comment: new FormControl(),
    });

    const newPermission = {
      key: 'edit',
      value: 'Edit',
    } as KeyValue<SettingsPermission, string>;

    spectator.component.previousPermission = {
      key: 'view',
      value: 'View',
    };

    spectator.component.entity = {
      key: 'story',
      value: 'story',
    };

    spectator.component.toggleCustomizer();
    spectator.component.permissionChange(newPermission);

    expect(
      projectsSettingsFeatureRolesPermissionsService.applyPermission
    ).toHaveBeenCalled();
    expect(spectator.component.formGroup.get('comment')?.value).toBeFalsy();
    expect(spectator.component.customizer).toBeTruthy();
    expect(spectator.component.previousPermission).toBe(newPermission);
  });

  it('permission change from no access set comments to true', () => {
    spectator.component.formGroup = new FormGroup({
      comment: new FormControl(),
    });

    const newPermission = {
      key: 'edit',
      value: 'Edit',
    } as KeyValue<SettingsPermission, string>;

    spectator.component.previousPermission = {
      key: 'no_access',
      value: 'No access',
    };

    spectator.component.entity = {
      key: 'story',
      value: 'story',
    };

    spectator.component.toggleCustomizer();
    spectator.component.permissionChange(newPermission);

    expect(
      projectsSettingsFeatureRolesPermissionsService.applyPermission
    ).toHaveBeenCalled();
    expect(spectator.component.formGroup.get('comment')?.value).toBeTruthy();
    expect(spectator.component.customizer).toBeTruthy();
    expect(spectator.component.previousPermission).toBe(newPermission);
  });

  it('permission change, hide customizer when form is disabled', () => {
    spectator.component.formGroup = new FormGroup({
      comment: new FormControl(),
    });

    spectator.component.formGroup.disable();

    const newPermission = {
      key: 'edit',
      value: 'Edit',
    } as KeyValue<SettingsPermission, string>;

    spectator.component.previousPermission = {
      key: 'view',
      value: 'View',
    };

    spectator.component.entity = {
      key: 'story',
      value: 'story',
    };

    spectator.component.permissionChange(newPermission);

    expect(
      projectsSettingsFeatureRolesPermissionsService.applyPermission
    ).toHaveBeenCalled();
    expect(spectator.component.formGroup.get('comment')?.value).toBeFalsy();
    expect(spectator.component.customizer).toBeFalsy();
    expect(spectator.component.previousPermission).toBe(newPermission);
  });
});
