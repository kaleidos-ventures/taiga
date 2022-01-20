/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { FormControl, FormGroup } from '@ngneat/reactive-forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslocoService } from '@ngneat/transloco';

import { ProjectsSettingsFeatureRolesPermissionsService } from './feature-roles-permissions.service';

describe('ProjectsSettingsFeatureRolesPermissionsService', () => {
  let spectator: SpectatorService<ProjectsSettingsFeatureRolesPermissionsService>;
  const createService = createServiceFactory({
    service: ProjectsSettingsFeatureRolesPermissionsService,
    mocks: [TranslocoService],
  });

  beforeEach(() => spectator = createService());

  describe('apply permission to formGroup', () => {
    it('no access - disable form', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        edit: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      });

      spectator.service.applyPermission(
        'wiki',
        'no_access',
        formGroup,
      );

      expect(formGroup.disabled).toBeTruthy();
    });

    it('enable former no access form', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        edit: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      });

      formGroup.disable();

      spectator.service.applyPermission(
        'wiki',
        'edit',
        formGroup,
      );

      expect(formGroup.disabled).toBeFalsy();
    });

    it('edit - create, modify, delete change to true', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      });

      spectator.service.applyPermission(
        'userstories',
        'edit',
        formGroup,
      );

      expect(formGroup.value).toEqual({
        create: true,
        modify: true,
        delete: true,
        comment: false,
      });
    });


    it('modules without comments', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      });

      // userstories has comments
      spectator.service.applyPermission(
        'userstories',
        'edit',
        formGroup,
      );

      expect(formGroup.get('comment').disabled).toBeFalsy();

      // wiki don't have comments
      spectator.service.applyPermission(
        'wiki',
        'edit',
        formGroup,
      );

      expect(formGroup.get('comment').disabled).toBeTruthy();
    });

    it('view - create, modify, delete change to false', () => {
      const formGroup = new FormGroup({
        create: new FormControl(true),
        modify: new FormControl(true),
        delete: new FormControl(true),
        comment: new FormControl(true),
      });

      spectator.service.applyPermission(
        'userstories',
        'view',
        formGroup,
      );

      expect(formGroup.value).toEqual({
        create: false,
        modify: false,
        delete: false,
        comment: true,
      });
    });
  });


  describe('get formGroup permission state', () => {
    it('no access, form disabled', () => {
      const formGroup = new FormGroup({
        create: new FormControl(true),
        modify: new FormControl(true),
        delete: new FormControl(true),
        comment: new FormControl(true),
      });

      formGroup.disable();

      const permission = spectator.service.formPermissionState(
        formGroup
      );

      expect(permission).toBe('no_access');
    });

    it('edit, can create, modify, delete', () => {
      const formGroup = new FormGroup({
        create: new FormControl(true),
        modify: new FormControl(true),
        delete: new FormControl(true),
        comment: new FormControl(true),
      });


      const permission = spectator.service.formPermissionState(
        formGroup
      );

      expect(permission).toBe('edit');
    });

    it('view, can not create, modify, delete', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(true),
      });


      const permission = spectator.service.formPermissionState(
        formGroup
      );

      expect(permission).toBe('view');
    });

    it('restricted, mixed true/false create, modify, delete', () => {
      const formGroup = new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(true),
        delete: new FormControl(false),
        comment: new FormControl(true),
      });

      const permission = spectator.service.formPermissionState(
        formGroup
      );

      expect(permission).toBe('restricted');
    });
  });

  it('permission form to bakend format - userstories', () => {
    const formGroup = new FormGroup({
      userstories: new FormGroup({
        create: new FormControl(true),
        modify: new FormControl(true),
        delete: new FormControl(true),
        comment: new FormControl(true),
      }),
    });

    let permission = spectator.service.getRoleFormGroupPermissions(
      formGroup
    );

    expect(permission).toEqual(
      [
        'view_us',
        'add_us',
        'modify_us',
        'delete_us',
        'comment_us',
      ]
    );

    formGroup.setValue({
      userstories: {
        create: false,
        modify: false,
        delete: false,
        comment: false,
      }
    });

    permission = spectator.service.getRoleFormGroupPermissions(
      formGroup
    );

    expect(permission).toEqual(['view_us']);


    formGroup.disable();
    permission = spectator.service.getRoleFormGroupPermissions(
      formGroup
    );

    expect(permission).toEqual([]);
  });

  it('format raw permissions to valid formGroup value', () => {
    const formGroup = new FormGroup({
      userstories: new FormGroup({
        create: new FormControl(false),
        modify: new FormControl(false),
        delete: new FormControl(false),
        comment: new FormControl(false),
      }),
    });

    const value = spectator.service.formatRawPermissions([
      'view_us',
      'add_us',
      'modify_us',
      'delete_us',
      'comment_us',
    ]);

    formGroup.patchValue(value);

    expect(formGroup.value).toEqual({
      userstories: {
        create: true,
        modify: true,
        delete: true,
        comment: true
      }
    });
  });
});
