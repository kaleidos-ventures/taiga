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
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Entity } from '@taiga/data';
import { SettingsPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/settings-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';

let nextId = 0;
@UntilDestroy()
@Component({
  selector: 'tg-role-advance-row',
  templateUrl: './role-advance-row.component.html',
  styleUrls: ['./role-advance-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleAdvanceRowComponent implements OnInit, OnChanges {
  @Input()
  public formGroup!: FormGroup;

  @Input()
  public entity!: KeyValue<Entity, string>;

  public basicPermissionList =
    this.projectsSettingsFeatureRolesPermissionsService.getEntityPermissions();

  public customizer = false;

  public permissionRowModel!: KeyValue<SettingsPermission, string>;
  public previousPermission?: KeyValue<SettingsPermission, string>;
  public isChildModule = false;
  public rolePermissionContainerId = `role-permission-container-${nextId++}`;

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
    private cd: ChangeDetectorRef
  ) {}

  public ngOnInit() {
    const childEntities: Entity[] = ['task', 'sprint'];

    this.isChildModule = childEntities.includes(this.entity.key);

    this.refreshPermission();
    this.previousPermission = this.permissionRowModel;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.formGroup) {
      this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.refreshPermission();
      });

      this.refreshPermission();
    }
  }

  public refreshPermission() {
    const currentPermission =
      this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(
        this.formGroup
      );

    const permissionName =
      this.basicPermissionList.get(currentPermission) ?? '';

    this.permissionRowModel = {
      key: currentPermission,
      value: permissionName,
    };

    this.permissionRowModel.toString = function () {
      return this.value;
    };

    if (!this.previousPermission) {
      this.previousPermission = this.permissionRowModel;
    }

    this.cd.markForCheck();
  }

  public trackByValue(_index: number, permission: KeyValue<string, string>) {
    return permission.value;
  }

  public toggleCustomizer() {
    this.customizer = !this.customizer;
  }

  public showCustomization() {
    return !this.formGroup.disabled;
  }

  public showComment() {
    return !this.formGroup.get('comment')!.disabled;
  }

  public permissionChange(permission: KeyValue<SettingsPermission, string>) {
    this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
      this.entity.key,
      permission.key,
      this.formGroup
    );

    if (this.previousPermission?.key === 'no_access') {
      this.formGroup.get('comment')?.setValue(true);
    }

    if (!this.showCustomization()) {
      this.customizer = false;
    }

    this.previousPermission = permission;
  }

  public insertionOrder() {
    return 0;
  }
}
