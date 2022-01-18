/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { KeyValue } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Module, Role } from '@taiga/data';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { SettingsPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/settings-permission.model';

@UntilDestroy()
@Component({
  selector: 'tg-role-permission-row',
  templateUrl: './role-permission-row.component.html',
  styleUrls: ['./role-permission-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RolePermissionRowComponent implements OnInit {
  public basicPermissionList = this.projectsSettingsFeatureRolesPermissionsService.getModulePermissions();

  @Input()
  public formGroup!: FormGroup;

  @Input()
  public role!: Role;

  public permissionRowModel!: KeyValue<SettingsPermission, string>;

  public showAdvancedSetting = false;
  public modules = this.projectsSettingsFeatureRolesPermissionsService.getModules();

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
  ) {}

  public ngOnInit() {
    this.refreshPermission();

    this.formGroup.valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refreshPermission();
      });
  }

  public refreshPermission() {
    const currentPermission = this.getGlobalPermission();

    const permissionName = this.basicPermissionList.get(currentPermission) ?? '';

    this.permissionRowModel = {
      key: currentPermission,
      value: permissionName,
    };
  }

  public moduleVisible(module: Module) {
    if (module === 'tasks' || module === 'sprints') {
      const userstoriesState = this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(this.getModuleFormGroup('userstories'));

      if (userstoriesState === 'no_access') {
        return false;
      }
    }

    return true;
  }

  public getGlobalPermission(): SettingsPermission {
    const modulesPermissions = Array.from(
      this.projectsSettingsFeatureRolesPermissionsService.getModules().keys()
    ).map((module) => {
      const form = this.getModuleFormGroup(module);
      return this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(form);
    });

    const isView = modulesPermissions.every((permission) => permission === 'view');

    if (isView) {
      return 'view';
    }

    const isEdit = modulesPermissions.every((permission) => permission === 'edit');

    if (isEdit) {
      return 'edit';
    }

    const isNoAccess = modulesPermissions.every((permission) => permission === 'no_access');

    if (isNoAccess) {
      return 'no_access';
    }

    const isCustom = modulesPermissions.find((permission) => {
      return permission === 'view' || permission == 'no_access';
    });

    if (isCustom) {
      return 'custom';
    }

    return 'restricted';
  }

  public getModuleFormGroup(module: Module) {
    return this.formGroup.get(module) as FormGroup;
  }

  public trackByValue(_index: number, permission: KeyValue<string, string>) {
    return permission.value;
  }

  public toggleAdvanceSetting() {
    this.showAdvancedSetting = !this.showAdvancedSetting;
  }

  public permissionChange(permission: KeyValue<SettingsPermission, string>) {
    for (const [module] of this.projectsSettingsFeatureRolesPermissionsService.getModules()) {
      const moduleGroup = this.getModuleFormGroup(module);

      this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
        module,
        permission.key,
        moduleGroup
      );
    }
  }

  public insertionOrder() {
    return 0;
  }
}
