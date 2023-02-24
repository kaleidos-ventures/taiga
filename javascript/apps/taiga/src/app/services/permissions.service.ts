/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Entity, EntityPermission } from '@taiga/data';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { selectCurrentProject } from '../modules/project/data-access/+state/selectors/project.selectors';
import { UtilsService } from '../shared/utils/utils-service.service';

const mapFormEntitiesPermissions: Record<
  Entity,
  Partial<Record<EntityPermission, string[]>>
> = {
  story: {
    view: ['view_story'],
    create: ['add_story'],
    modify: ['modify_story'],
    delete: ['delete_story'],
    comment: ['comment_story'],
  },
  task: {
    view: ['view_task'],
    create: ['add_task'],
    modify: ['modify_task'],
    delete: ['delete_task'],
    comment: ['comment_task'],
  },
  sprint: {
    view: ['view_milestones'],
    create: ['add_milestone'],
    modify: ['modify_milestone'],
    delete: ['delete_milestone'],
  },
  issue: {
    view: ['view_issues'],
    create: ['add_issue'],
    modify: ['modify_issue'],
    delete: ['delete_issue'],
    comment: ['comment_issue'],
  },
  epic: {
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

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  public static mapFormEntitiesPermissions = mapFormEntitiesPermissions;

  constructor(private store: Store) {}

  public formatRawPermissions(permission: string[]) {
    const formatedPermissions = Object.entries(
      mapFormEntitiesPermissions
    ).reduce((acc, [entity, entityValue]) => {
      Object.entries(entityValue).forEach(([action, list]) => {
        if (list.find((it) => permission.includes(it))) {
          if (!acc[entity]) {
            acc[entity] = {};
          }

          acc[entity][action] = true;
        }
      });

      return acc;
    }, {} as Record<string, Record<string, boolean>>);

    return formatedPermissions as Partial<
      Record<Entity, Record<EntityPermission, boolean>>
    >;
  }

  public hasPermissions(
    entity: Entity,
    permissions: EntityPermission[],
    operator?: 'AND' | 'OR'
  ): boolean;
  public hasPermissions(
    entity: Entity,
    permission: EntityPermission,
    operator?: 'AND' | 'OR'
  ): boolean;
  public hasPermissions(
    entities: Entity[],
    permission: EntityPermission,
    operator?: 'AND' | 'OR'
  ): boolean;
  public hasPermissions(
    entities: Entity[],
    permissions: EntityPermission[],
    operator?: 'AND' | 'OR'
  ): boolean;
  public hasPermissions(
    entity: Entity | Entity[],
    permission: EntityPermission | EntityPermission[],
    operator: 'AND' | 'OR' = 'AND'
  ): boolean {
    const project = UtilsService.getState(this.store, selectCurrentProject);

    if (!project) {
      return false;
    }

    if (project.userIsAdmin) {
      return true;
    }

    const entities = Array.isArray(entity) ? entity : [entity];
    const permissions = Array.isArray(permission) ? permission : [permission];

    const projectPermissions = this.formatRawPermissions(
      project.userPermissions
    );

    if (operator === 'AND') {
      return entities.every((entity) => {
        return permissions.every((permission) => {
          return projectPermissions?.[entity]?.[permission];
        });
      });
    }

    return entities.some((entity) => {
      return permissions.some((permission) => {
        return projectPermissions?.[entity]?.[permission];
      });
    });
  }

  public hasPermissions$(
    entity: Entity,
    permissions: EntityPermission[],
    operator?: 'AND' | 'OR'
  ): Observable<boolean>;
  public hasPermissions$(
    entity: Entity,
    permission: EntityPermission,
    operator?: 'AND' | 'OR'
  ): Observable<boolean>;
  public hasPermissions$(
    entities: Entity[],
    permission: EntityPermission,
    operator?: 'AND' | 'OR'
  ): Observable<boolean>;
  public hasPermissions$(
    entities: Entity[],
    permissions: EntityPermission[],
    operator?: 'AND' | 'OR'
  ): Observable<boolean>;
  public hasPermissions$(
    entity: Entity | Entity[],
    permission: EntityPermission | EntityPermission[],
    operator: 'AND' | 'OR' = 'AND'
  ): Observable<boolean> {
    const entities = Array.isArray(entity) ? entity : [entity];
    const permissions = Array.isArray(permission) ? permission : [permission];

    return this.store.select(selectCurrentProject).pipe(
      map((project) => {
        if (project) {
          return this.hasPermissions(entities, permissions, operator);
        }

        return false;
      }),
      share()
    );
  }
}
