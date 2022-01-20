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
import {
  Conflict,
  PermissionConflict,
  TextConflict,
} from '../models/modal-permission.model';
import { Module } from '@taiga/data';

const mapFormModulesPermissions: Record<
  Module,
  Partial<Record<ModulePermission, string[]>>
> = {
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
  },
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
      [
        'create',
        this.translocoService.translate(
          'project_settings.roles_permissions.create'
        ),
      ],
      [
        'modify',
        this.translocoService.translate(
          'project_settings.roles_permissions.modify'
        ),
      ],
      [
        'delete',
        this.translocoService.translate(
          'project_settings.roles_permissions.delete'
        ),
      ],
    ]);
  }

  public getModalPermissions(): Map<
    ModulePermission,
    {
      public: string;
      member: string;
    }
  > {
    return new Map([
      [
        'create',
        {
          public: this.translocoService.translate(
            'project_settings.modal_permissions.can_create'
          ),
          member: this.translocoService.translate(
            'project_settings.modal_permissions.cannot_create'
          ),
        },
      ],
      [
        'modify',
        {
          public: this.translocoService.translate(
            'project_settings.modal_permissions.can_modify'
          ),
          member: this.translocoService.translate(
            'project_settings.modal_permissions.cannot_modify'
          ),
        },
      ],
      [
        'delete',
        {
          public: this.translocoService.translate(
            'project_settings.modal_permissions.can_delete'
          ),
          member: this.translocoService.translate(
            'project_settings.modal_permissions.cannot_delete'
          ),
        },
      ],
    ]);
  }

  public getModulePermissions(): Map<SettingsPermission, string> {
    return new Map([
      [
        'no_access',
        this.translocoService.translate(
          'project_settings.roles_permissions.no_access'
        ),
      ],
      [
        'view',
        this.translocoService.translate(
          'project_settings.roles_permissions.can_view'
        ),
      ],
      [
        'edit',
        this.translocoService.translate(
          'project_settings.roles_permissions.can_edit'
        ),
      ],
    ]);
  }

  public applyPermission(
    module: Module,
    type: SettingsPermission,
    formGroup: FormGroup
  ) {
    if (formGroup.disabled) {
      formGroup.enable();
    }

    if (type === 'edit') {
      formGroup.patchValue({
        create: true,
        modify: true,
        delete: true,
      });
    } else if (type === 'view') {
      formGroup.patchValue({
        create: false,
        modify: false,
        delete: false,
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
      Module,
      Record<ModulePermission, boolean>
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
            return (
              value && !roleForm.get(module)?.get(modulePermission)?.disabled
            );
          })
          .forEach(([modulePermission]) => {
            const permission =
              mapFormModulesPermissions[module as Module][
                modulePermission as ModulePermission
              ];

            if (permission) {
              acc.push(...permission);
            }
          });
        return acc;
      }, [] as string[]);
  }

  public formatRawPermissions(permission: string[]) {
    const formatedPermissions = Object.entries(
      mapFormModulesPermissions
    ).reduce((acc, [module, moduleValue]) => {
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

    return formatedPermissions as Record<
      Module,
      Record<ModulePermission, boolean>
    >;
  }

  public getConflictsPermissions(
    publicPermissions: Record<Module, Record<ModulePermission, boolean>>,
    memberPermissions: Record<Module, Record<ModulePermission, boolean>>
  ) {
    const conflicts: Conflict[] = [];
    (Object.keys(publicPermissions) as Module[]).forEach((key) => {
      const publicPermissionKeys = Object.keys(
        publicPermissions[key]
      ) as ModulePermission[];
      if (memberPermissions[key]) {
        const tempMissingPerm: ModulePermission[] = [];
        publicPermissionKeys.forEach((perm) => {
          if (!memberPermissions[key][perm]) {
            tempMissingPerm.push(perm);
          }
        });
        if (tempMissingPerm.length) {
          conflicts.push({
            name: key,
            permission: {
              onlyPublicPermission: tempMissingPerm,
              public: publicPermissionKeys,
              member: Object.keys(memberPermissions[key]) as ModulePermission[],
            },
            texts: this.generateConflictsTexts({
              onlyPublicPermission: tempMissingPerm,
              public: publicPermissionKeys,
              member: Object.keys(memberPermissions[key]) as ModulePermission[],
            }),
          });
        }
      } else {
        conflicts.push({
          name: key,
          permission: {
            onlyPublicPermission: publicPermissionKeys,
            public: publicPermissionKeys,
            member: [],
          },
          texts: this.generateConflictsTexts({
            onlyPublicPermission: publicPermissionKeys,
            public: publicPermissionKeys,
            member: [],
          }),
        });
      }
    });
    return conflicts.length ? conflicts : undefined;
  }

  public generateConflictsTexts(permission: PermissionConflict) {
    const onlyInPublicPermission = permission.onlyPublicPermission;
    const textsTemp: TextConflict = {
      public: {
        text: [],
        restrictions: [],
      },
      member: {
        text: [],
        restrictions: [],
      },
    };
    if (onlyInPublicPermission.includes('create' && 'modify' && 'delete')) {
      // edit case
      textsTemp.public.text.push(this.getModulePermissions().get('edit')!);
      if (!permission['member'].length) {
        textsTemp.member.text.push(
          this.getModulePermissions().get('no_access')!
        );
      } else if (permission['member'].includes('view')) {
        textsTemp.member.text.push(this.getModulePermissions().get('view')!);
      }
    } else if (
      onlyInPublicPermission.some(
        (it) => it === 'create' || it === 'modify' || it === 'delete'
      )
    ) {
      // edit restricted case
      const editRestrictionsText = `${this.getModulePermissions().get(
        'edit'
      )!} ${this.translocoService.translate(
        'project_settings.roles_permissions.restricted'
      )}`;
      if (permission.public.includes('create' && 'modify' && 'delete')) {
        textsTemp.public.text.push(this.getModulePermissions().get('edit')!);
      } else {
        textsTemp.public.text.push(editRestrictionsText);
      }
      if (
        permission.member.some(
          (it) => it === 'create' || it === 'modify' || it === 'delete'
        )
      ) {
        textsTemp.member.text.push(editRestrictionsText);
      } else {
        textsTemp.member.text.push(
          this.translocoService.translate(
            'project_settings.modal_permissions.cannot_edit'
          )
        );
      }

      const restrictions = onlyInPublicPermission.filter(
        (perm) => perm === 'create' || perm === 'modify' || perm === 'delete'
      );
      if (restrictions.length) {
        restrictions.forEach((restriction) => {
          if (!permission.public.includes('create' && 'modify' && 'delete')) {
            textsTemp.public.restrictions?.push(
              this.getModalPermissions().get(restriction)!.public
            );
          }
          textsTemp.member.restrictions?.push(
            this.getModalPermissions().get(restriction)!.member
          );
        });
      }
    }
    if (onlyInPublicPermission.includes('comment')) {
      // comment case

      textsTemp.public.text.push(
        this.translocoService.translate(
          'project_settings.roles_permissions.can_comment'
        )
      );
      textsTemp.member.text.push(
        this.translocoService.translate(
          'project_settings.roles_permissions.cannot_comment'
        )
      );
    }
    if (onlyInPublicPermission.every((it) => it === 'view')) {
      // view case
      textsTemp.public.text.push(this.getModulePermissions().get('view')!);
      textsTemp.member.text.push(this.getModulePermissions().get('no_access')!);
    }
    return textsTemp;
  }
}
