/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ModuleConflictPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/modal-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';

@Component({
  selector: 'tg-modal-permission-comparison',
  templateUrl: './modal-permission-comparison.component.html',
  styleUrls: ['./modal-permission-comparison.component.css'],
})
export class ModalPermissionComparisonComponent {
  @Input()
  public conflictPermissions!: ModuleConflictPermission[];

  @Output()
  public closeModal = new EventEmitter();

  public modules =
    this.projectsSettingsFeatureRolesPermissionsService.getModules();
  public dropdown: Record<string, boolean> = {};

  public trackByIndex(index: number) {
    return index;
  }

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService
  ) {}

  public getParam(
    conflictName: string,
    moduleName: string,
    type: string,
    idx: number
  ) {
    return `${conflictName}${moduleName}${type}${idx}`
      .replace(/\s/g, '')
      .toLocaleLowerCase();
  }

  public isRestricted(text: string) {
    const restrictedText = 'project_settings.roles_permissions.restricted';
    return text === restrictedText;
  }

  public handleDropdown(key: string) {
    if (this.dropdown[key]) {
      this.dropdown[key] = !this.dropdown[key];
    } else {
      this.dropdown[key] = true;
    }
  }

  public close() {
    this.closeModal.next();
  }
}
