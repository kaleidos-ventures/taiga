/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input } from '@angular/core';
import { Conflict } from '~/app/modules/project/settings/feature-roles-permissions/models/modal-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';

let nextId = 0;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[tg-modal-permission-entity-row]',
  templateUrl: './modal-permission-entity-row.component.html',
  styleUrls: [
    './modal-permission-entity-row.component.css',
    '../../modal-permission-comparison-common.css',
  ],
})
export class ModalPermissionEntityRowComponent {
  @Input()
  public conflict!: Conflict;

  @Input()
  public memberText!: string;

  @Input()
  public publicText!: string;

  @Input()
  public showHeader = false;

  public id = `permission-row-${nextId++}`;

  public open = false;

  public entities =
    this.projectsSettingsFeatureRolesPermissionsService.getEntities();

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService
  ) {}

  public isRestricted(text: string) {
    const restrictedText = 'project_settings.roles_permissions.restricted';
    return text === restrictedText;
  }

  public toggleDropdown() {
    this.open = !this.open;
  }

  public trackByIndex(index: number) {
    return index;
  }
}
