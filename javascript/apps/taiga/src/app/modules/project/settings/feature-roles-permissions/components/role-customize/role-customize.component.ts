/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { KeyValue } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';

@Component({
  selector: 'tg-role-customize',
  templateUrl: './role-customize.component.html',
  styleUrls: ['./role-customize.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleCustomizeComponent {
  @Input()
  public formGroup!: FormGroup;

  @Input()
  public toggleCustomize = false;

  public basicPermissionList =
    this.projectsSettingsFeatureRolesPermissionsService.getPermissions();

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService
  ) {}

  public trackByValue(_index: number, permission: KeyValue<string, string>) {
    return permission.value;
  }

  public insertionOrder() {
    return 0;
  }
}
