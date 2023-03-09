/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Entity, EntityPermission, Role } from '@taiga/data';
import { PermissionsService } from '~/app/services/permissions.service';
import {
  Conflict,
  EntityConflictPermission,
  PermissionConflict,
  TextConflict,
} from '../models/modal-permission.model';
import { SettingsPermission } from '../models/settings-permission.model';

@Injectable({ providedIn: 'root' })
export class ProjectsSettingsFeatureRolesPermissionsService {
  constructor(private permissionsService: PermissionsService) {}

  public hasComments(entity: Entity) {
    return !['wiki', 'sprints'].includes(entity);
  }

  public getEntities(): Map<Entity, string> {
    return new Map([['story', 'commons.stories']]);
  }

  public getPermissions(): Map<EntityPermission, string> {
    return new Map([
      ['create', 'project_settings.roles_permissions.create'],
      ['modify', 'project_settings.roles_permissions.modify'],
      ['delete', 'project_settings.roles_permissions.delete'],
    ]);
  }

  public getModalPermissions(): Map<
    EntityPermission,
    {
      public: string;
      member: string;
    }
  > {
    return new Map([
      [
        'create',
        {
          public: 'project_settings.modal_permissions.can_create',
          member: 'project_settings.modal_permissions.cannot_create',
        },
      ],
      [
        'modify',
        {
          public: 'project_settings.modal_permissions.can_modify',
          member: 'project_settings.modal_permissions.cannot_modify',
        },
      ],
      [
        'delete',
        {
          public: 'project_settings.modal_permissions.can_delete',
          member: 'project_settings.modal_permissions.cannot_delete',
        },
      ],
    ]);
  }

  public getEntityPermissions(): Map<SettingsPermission, string> {
    return new Map([
      ['no_access', 'project_settings.roles_permissions.no_access'],
      ['view', 'project_settings.roles_permissions.can_view'],
      ['edit', 'project_settings.roles_permissions.can_edit'],
    ]);
  }

  public applyPermission(
    entity: Entity,
    type: SettingsPermission,
    formGroup: FormGroup
  ) {
    if (type !== 'no_access' && formGroup.disabled) {
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
    } else if (type === 'no_access' && formGroup.enabled) {
      formGroup.disable();
    }

    if (!this.hasComments(entity) && formGroup.get('comment')?.enabled) {
      formGroup.get('comment')?.disable();
    }

    formGroup.markAsDirty();
  }

  public formPermissionState(formGroup: FormGroup): SettingsPermission {
    if (formGroup.disabled) {
      return 'no_access';
    }

    const formValue = formGroup.value as Record<EntityPermission, boolean>;

    if (formValue.create && formValue.modify && formValue.delete) {
      return 'edit';
    } else if (!formValue.create && !formValue.modify && !formValue.delete) {
      return 'view';
    }

    return 'restricted';
  }

  public getRoleFormGroupPermissions(roleForm: FormGroup) {
    const mapFormEntitiesPermissions =
      PermissionsService.mapFormEntitiesPermissions;
    const roleFormValue = roleForm.value as Record<
      Entity,
      Record<EntityPermission, boolean>
    >;

    return Object.entries(roleFormValue)
      .filter(([entity]) => !roleForm.get(entity)?.disabled)
      .filter(([entity]) => {
        if (
          roleForm.get('story')?.disabled &&
          (entity === 'task' || entity === 'sprint')
        ) {
          return false;
        }

        return true;
      })
      .reduce((acc, [entity, entityPermissions]) => {
        const permission = mapFormEntitiesPermissions[entity as Entity]['view'];

        if (permission) {
          acc.push(...permission);
        }

        Object.entries(entityPermissions)
          .filter(([entityPermission, value]) => {
            return (
              value && !roleForm.get(entity)?.get(entityPermission)?.disabled
            );
          })
          .forEach(([entityPermission]) => {
            const permission =
              mapFormEntitiesPermissions[entity as Entity][
                entityPermission as EntityPermission
              ];

            if (permission) {
              acc.push(...permission);
            }
          });
        return acc;
      }, [] as string[]);
  }

  public getConflictsPermissions(
    publicPermissions: Partial<
      Record<Entity, Record<EntityPermission, boolean>>
    >,
    memberPermissions: Partial<
      Record<Entity, Record<EntityPermission, boolean>>
    >
  ) {
    const conflicts: Conflict[] = [];

    (Object.keys(publicPermissions) as Entity[])
      .filter((permission) => {
        if (
          !memberPermissions['story'] &&
          (permission === 'sprint' || permission === 'task')
        ) {
          return false;
        }

        return true;
      })
      .forEach((key) => {
        const publicPermissionKeys = Object.keys(
          publicPermissions[key]!
        ) as EntityPermission[];

        if (memberPermissions[key]) {
          const tempMissingPerm: EntityPermission[] = [];
          publicPermissionKeys.forEach((perm) => {
            if (!memberPermissions?.[key]?.[perm]) {
              tempMissingPerm.push(perm);
            }
          });
          if (tempMissingPerm.length) {
            conflicts.push({
              name: key,
              permission: {
                onlyPublicPermission: tempMissingPerm,
                public: publicPermissionKeys,
                member: Object.keys(
                  memberPermissions[key]!
                ) as EntityPermission[],
              },
              texts: this.generateConflictsTexts({
                onlyPublicPermission: tempMissingPerm,
                public: publicPermissionKeys,
                member: Object.keys(
                  memberPermissions[key]!
                ) as EntityPermission[],
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

    const isEditPermissions = (permissions: EntityPermission[]) => {
      return ['create', 'modify', 'delete'].every((it) =>
        permissions.includes(it as EntityPermission)
      );
    };

    if (isEditPermissions(onlyInPublicPermission)) {
      // edit case
      textsTemp.public.text.push(this.getEntityPermissions().get('edit')!);
      if (!permission['member'].length) {
        textsTemp.member.text.push(
          this.getEntityPermissions().get('no_access')!
        );
      } else if (permission['member'].includes('view')) {
        textsTemp.member.text.push(this.getEntityPermissions().get('view')!);
      }
    } else if (
      onlyInPublicPermission.some(
        (it) => it === 'create' || it === 'modify' || it === 'delete'
      )
    ) {
      // edit restricted case
      const editRestrictionsText =
        'project_settings.roles_permissions.restricted';

      if (isEditPermissions(permission.public)) {
        textsTemp.public.text.push(this.getEntityPermissions().get('edit')!);
      } else {
        textsTemp.public.text.push(editRestrictionsText);
      }
      if (
        permission.member.some(
          (it) => it === 'create' || it === 'modify' || it === 'delete'
        )
      ) {
        textsTemp.member.text.push(editRestrictionsText);
      } else if (!permission.member.length) {
        textsTemp.member.text.push(
          this.getEntityPermissions().get('no_access')!
        );
      } else {
        textsTemp.member.text.push(
          'project_settings.modal_permissions.cannot_edit'
        );
      }

      const restrictions = onlyInPublicPermission.filter(
        (perm) => perm === 'create' || perm === 'modify' || perm === 'delete'
      );
      if (restrictions.length) {
        restrictions.forEach((restriction) => {
          textsTemp.public.restrictions?.push(
            this.getModalPermissions().get(restriction)!.public
          );

          textsTemp.member.restrictions?.push(
            this.getModalPermissions().get(restriction)!.member
          );
        });
      }
    }

    // only show can comment if members is not "no_access"
    if (
      onlyInPublicPermission.includes('comment') &&
      permission.member.length
    ) {
      // comment case

      textsTemp.public.text.push(
        'project_settings.roles_permissions.can_comment'
      );
      textsTemp.member.text.push(
        'project_settings.roles_permissions.cannot_comment'
      );
    }

    if (
      onlyInPublicPermission.every((it) => it === 'view') ||
      (onlyInPublicPermission.includes('view') &&
        onlyInPublicPermission.includes('comment'))
    ) {
      // view case
      textsTemp.public.text.push(this.getEntityPermissions().get('view')!);
      textsTemp.member.text.push(this.getEntityPermissions().get('no_access')!);
    }

    return textsTemp;
  }

  public getMembersPermissionsConflics(
    publicPermissionsList: string[],
    memberRoles: Role[]
  ): EntityConflictPermission[] {
    const conflictPermissions: EntityConflictPermission[] = [];

    const publicPermissions = this.permissionsService.formatRawPermissions(
      publicPermissionsList
    );

    memberRoles.forEach((memberRole) => {
      if (!memberRole.isAdmin) {
        const memberPermissions = this.permissionsService.formatRawPermissions(
          memberRole.permissions
        );

        const conflicts = this.getConflictsPermissions(
          publicPermissions,
          memberPermissions
        );

        if (conflicts) {
          conflictPermissions.push({
            name: memberRole.name,
            conflicts,
          });
        }
      }
    });

    return conflictPermissions;
  }
}
