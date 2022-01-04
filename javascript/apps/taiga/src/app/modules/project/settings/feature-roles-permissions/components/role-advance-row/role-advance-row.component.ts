/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { KeyValue } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { SettingsPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/settings-permission.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'tg-role-advance-row',
  templateUrl: './role-advance-row.component.html',
  styleUrls: ['./role-advance-row.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleAdvanceRowComponent implements OnInit {
  public basicPermissionList = this.projectsSettingsFeatureRolesPermissionsService.getModulePermissions();

  @Input()
  public formGroup!: FormGroup;

  @Input()
  public module!: KeyValue<string, string>;

  public customizer = false;

  public permissionRowModel!: KeyValue<SettingsPermission, string>;

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.refreshPermission();

    this.formGroup.valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.refreshPermission();
        this.cd.detectChanges();
      });
  }

  public refreshPermission() {
    const currentPermission = this.projectsSettingsFeatureRolesPermissionsService.formPermissionState(this.formGroup);

    const permissionName = this.basicPermissionList.get(currentPermission) ?? '';

    this.permissionRowModel = {
      key: currentPermission,
      value: permissionName,
    };
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

  public permissionChange(permission: KeyValue<SettingsPermission, string>) {
    this.projectsSettingsFeatureRolesPermissionsService.applyPermission(
      permission.key,
      this.formGroup
    );
  }
}
