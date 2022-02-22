/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Entity } from '@taiga/data';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { SettingsPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/settings-permission.model';

let nextId = 0;
@UntilDestroy()
@Component({
  selector: 'tg-role-permission-row',
  templateUrl: './role-permission-row.component.html',
  styleUrls: ['./role-permission-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolePermissionRowComponent implements OnChanges {
  @Input()
  public formGroup!: FormGroup;

  @Input()
  public name!: string;

  @Input()
  public numMembers!: number;

  @Input()
  @HostBinding('attr.has-members')
  public hasMembers = true;

  public basicPermissionList =
    this.projectsSettingsFeatureRolesPermissionsService.getEntityPermissions();

  public permissionRowModel!: KeyValue<SettingsPermission, string>;
  public advancedSettingsContainerId = `advanced-settings-container-${nextId++}`;

  public showAdvancedSetting = false;
  public entities =
    this.projectsSettingsFeatureRolesPermissionsService.getEntities();

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.formGroup) {
      this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.refreshPermission();
        this.checkRestrictions();
      });

      this.refreshPermission();
    }
  }

  public refreshPermission() {
    const currentPermission = this.getGlobalPermission();

    const permissionName =
      this.basicPermissionList.get(currentPermission) ?? '';

    this.permissionRowModel = {
      key: currentPermission,
      value: permissionName,
    };

    this.permissionRowModel.toString = function () {
      return this.value;
    };
  }

  public checkRestrictions() {
    const userstoriesState =
      this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(
        this.getEntityFormGroup('us')
      );

    if (userstoriesState === 'no_access') {
      this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
        'task',
        'no_access',
        this.getEntityFormGroup('task')
      );
      this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
        'sprint',
        'no_access',
        this.getEntityFormGroup('sprint')
      );
    }
  }

  public entityVisible(entity: Entity) {
    if (entity === 'task' || entity === 'sprint') {
      const userstoriesState =
        this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(
          this.getEntityFormGroup('us')
        );

      if (userstoriesState === 'no_access') {
        return false;
      }
    }

    return true;
  }

  public getGlobalPermission(): SettingsPermission {
    const entitiesPermissions = Array.from(
      this.projectsSettingsFeatureRolesPermissionsService.getEntities().keys()
    ).map((entity) => {
      const form = this.getEntityFormGroup(entity);
      return this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(
        form
      );
    });

    const isView = entitiesPermissions.every(
      (permission) => permission === 'view'
    );

    if (isView) {
      return 'view';
    }

    const isEdit = entitiesPermissions.every(
      (permission) => permission === 'edit'
    );

    if (isEdit) {
      return 'edit';
    }

    const isNoAccess = entitiesPermissions.every(
      (permission) => permission === 'no_access'
    );

    if (isNoAccess) {
      return 'no_access';
    }

    const isCustom = entitiesPermissions.find((permission) => {
      return permission === 'view' || permission == 'no_access';
    });

    if (isCustom) {
      return 'custom';
    }

    return 'restricted';
  }

  public getEntityFormGroup(entity: Entity) {
    return this.formGroup.get(entity) as FormGroup;
  }

  public trackByValue(_index: number, permission: KeyValue<string, string>) {
    return permission.value;
  }

  public toggleAdvanceSetting() {
    this.showAdvancedSetting = !this.showAdvancedSetting;
  }

  public permissionChange(permission: KeyValue<SettingsPermission, string>) {
    for (const [
      entity,
    ] of this.projectsSettingsFeatureRolesPermissionsService.getEntities()) {
      const entityGroup = this.getEntityFormGroup(entity);

      this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
        entity,
        permission.key,
        entityGroup
      );
    }
  }

  public insertionOrder() {
    return 0;
  }
}
