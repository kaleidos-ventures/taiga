/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  OnChanges,
  Component,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import { Role } from '@taiga/data';
import { ModuleConflictPermission } from '~/app/modules/project/settings/feature-roles-permissions/models/modal-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from '~/app/modules/project/settings/feature-roles-permissions/services/feature-roles-permissions.service';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'tg-modal-permission-comparison',
  templateUrl: './modal-permission-comparison.component.html',
  styleUrls: ['./modal-permission-comparison.component.css'],
})
export class ModalPermissionComparisonComponent implements OnChanges {
  @Input()
  public memberRoles!: Role[];

  @Input()
  public publicPermissions!: string[];

  @Output()
  public hasConflicts = new EventEmitter<boolean>();

  @Output()
  public closeModal = new EventEmitter();

  public conflictPermissions!: ModuleConflictPermission[];
  public modules =
    this.projectsSettingsFeatureRolesPermissionsService.getModules();
  public dropdown: Record<string, boolean> = {};

  public trackByIndex(index: number) {
    return index;
  }

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
    private translocoService: TranslocoService
  ) {}

  public ngOnChanges() {
    this.fillConflictsPermissions();
  }

  public fillConflictsPermissions() {
    this.conflictPermissions = [];
    const publicPermissions =
      this.projectsSettingsFeatureRolesPermissionsService.formatRawPermissions(
        this.publicPermissions
      );
    this.memberRoles.forEach((memberRole) => {
      if (!memberRole.isAdmin) {
        const memberPermissions =
          this.projectsSettingsFeatureRolesPermissionsService.formatRawPermissions(
            memberRole.permissions
          );

        const conflicts =
          this.projectsSettingsFeatureRolesPermissionsService.getConflictsPermissions(
            publicPermissions,
            memberPermissions
          );

        if (conflicts) {
          this.conflictPermissions.push({
            name: memberRole.name,
            conflicts,
          });
        }
      }
    });
    this.hasConflicts.next(!!this.conflictPermissions.length);
  }

  public getParam(name: string, type: string, idx: number) {
    return `${name}${type}${idx}`.replace(/\s/g, '').toLocaleLowerCase();
  }

  public isRestricted(text: string) {
    const restrictedText = this.translocoService
      .translate('project_settings.roles_permissions.restricted')
      .replace(/[{()}]/g, '');
    return text.includes(restrictedText);
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
