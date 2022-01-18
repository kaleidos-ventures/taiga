/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { SettingsPermission } from '../models/settings-permission.model';
import { ModulePermission } from '../models/module-permission.model';
import { Module } from '@taiga/data';

const mapFormModulesPermissions: Record<Module, Partial<Record<ModulePermission, string[]>>> = {
  userstories: {
    view: ['view_us'],
    create: ['add_us'],
    modify: ['modify_us'],
    delete: ['delete_us'],
    comment: ['comment_us'],
  },
  tasks: {
    view: ['view_tasks'],
    create: ['add_task'],
    modify: ['modify_task'],
    delete: ['delete_task'],
    comment: ['comment_task'],
  },
  sprints: {
    view: ['view_milestones'],
    create: ['add_milestone'],
    modify: ['modify_milestone'],
    delete: ['delete_milestone'],
  },
  issues: {
    view: ['view_issues'],
    create: ['add_issue'],
    modify: ['modify_issue'],
    delete: ['delete_issue'],
    comment: ['comment_issue'],
  },
  epics: {
    view: ['view_epics'],
    create: ['add_epic'],
    modify: ['modify_epic'],
    delete: ['delete_epic'],
    comment: ['comment_epic'],
  },
  wiki: {
    view: ['view_wiki_pages', 'view_wiki_links'],
    create: ['add_wiki_page', 'add_wiki_link'],
    modify: ['modify_wiki_page', 'modify_wiki_link'],
    delete: ['delete_wiki_page', 'delete_wiki_link'],
  }
};

@Injectable({ providedIn: 'root' })
export class ProjectsSettingsFeatureRolesPermissionsService {
  constructor(private translocoService: TranslocoService) {}

  public hasComments(module: Module) {
    return !['wiki', 'sprints'].includes(module);
  }

  public getModules(): Map<Module, string> {
    return new Map([
      ['userstories', this.translocoService.translate('commons.userstories')],
      ['tasks', this.translocoService.translate('commons.tasks')],
      ['sprints', this.translocoService.translate('commons.sprints')],
      ['issues', this.translocoService.translate('commons.issues')],
      ['epics', this.translocoService.translate('commons.epics')],
      ['wiki', this.translocoService.translate('commons.wiki')],
    ]);
  }

  public getPermissions(): Map<ModulePermission, string> {
    return new Map([
      ['create', this.translocoService.translate('project_settings.roles_permissions.create')],
      ['modify', this.translocoService.translate('project_settings.roles_permissions.modify')],
      ['delete', this.translocoService.translate('project_settings.roles_permissions.delete')],
    ]);
  }

  public getModulePermissions(): Map<SettingsPermission, string> {
    return new Map([
      ['no_access', this.translocoService.translate('project_settings.roles_permissions.no_access')],
      ['view', this.translocoService.translate('project_settings.roles_permissions.can_view')],
      ['edit', this.translocoService.translate('project_settings.roles_permissions.can_edit')],
    ]);
  }

  public applyPermission(module: Module, type: SettingsPermission, formGroup: FormGroup) {
    if (formGroup.disabled) {
      formGroup.enable();
    }

    if (type === 'edit') {
      formGroup.patchValue({
        create: true,
        modify: true,
        delete: true
      });
    } else if (type === 'view') {
      formGroup.patchValue({
        create: false,
        modify: false,
        delete: false
      });
    } else if (type === 'no_access') {
      formGroup.disable();
    }

    if (!this.hasComments(module)) {
      formGroup.get('comment')?.disable();
    }
  }

  public formPermissionState(formGroup: FormGroup): SettingsPermission {
    if (formGroup.disabled) {
      return 'no_access';
    }

    const formValue = formGroup.value as Record<ModulePermission, boolean>;

    if (formValue.create && formValue.modify && formValue.delete) {
      return 'edit';
    } else if (!formValue.create && !formValue.modify && !formValue.delete) {
      return 'view';
    }

    return 'restricted';
  }

  public getRoleFormGroupPermissions(roleForm: FormGroup) {
    const roleFormValue = roleForm.value as Record<
    Module, Record<ModulePermission, boolean>
    >;

    return Object.entries(roleFormValue)
      .filter(([module]) => !roleForm.get(module)?.disabled)
      .reduce((acc, [module, modulePermissions]) => {
        const permission = mapFormModulesPermissions[module as Module]['view'];

        if (permission) {
          acc.push(...permission);
        }

        Object.entries(modulePermissions)
          .filter(([modulePermission, value]) => {
            return value && !roleForm.get(module)?.get(modulePermission)?.disabled;
          })
          .forEach(([modulePermission]) => {
            const permission = mapFormModulesPermissions[module as Module][modulePermission as ModulePermission];

            if (permission) {
              acc.push(...permission);
            }
          });
        return acc;
      }, [] as string[]);
  }

  public formatRawPermissions(permission: string[]) {
    const formatedPermissions = Object.entries(mapFormModulesPermissions).reduce((acc, [module, moduleValue]) => {

      Object.entries(moduleValue).forEach(([action, list]) => {
        if (list.find((it) => permission.includes(it))) {
          if (!acc[module]) {
            acc[module] = {};
          }

          acc[module][action] = true;
        }
      });

      return acc;
    }, {} as Record<string, Record<string, boolean>>);

    return formatedPermissions as Record<Module, Record<ModulePermission, boolean>>;
  }
}
