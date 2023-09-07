/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, Input, EventEmitter, Output } from '@angular/core';
import { EntityConflictPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/modal-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { TuiButtonModule } from '@taiga-ui/core';
import { ModalPermissionEntityRowComponent } from './components/modal-permission-entity-row/modal-permission-entity-row.component';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'tg-modal-permission-comparison',
  templateUrl: './modal-permission-comparison.component.html',
  styleUrls: [
    './modal-permission-comparison.component.css',
    './modal-permission-comparison-common.css',
  ],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ModalPermissionEntityRowComponent,
    TuiButtonModule,
  ],
})
export class ModalPermissionComparisonComponent {
  @Input()
  public conflictPermissions!: EntityConflictPermission[];

  @Output()
  public closeModal = new EventEmitter();

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService
  ) {}

  public trackByIndex(index: number) {
    return index;
  }

  public close() {
    this.closeModal.emit();
  }
}
