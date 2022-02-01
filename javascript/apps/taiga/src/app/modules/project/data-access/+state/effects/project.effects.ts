/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { filter, map, tap } from 'rxjs/operators';

import * as ProjectActions from '../actions/project.actions';
import { ProjectApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
@Injectable()
export class ProjectEffects {
  public loadProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchProject),
      fetch({
        run: (action) => {
          return this.projectApiService.getProject(action.slug).pipe(
            map((project) => {
              return ProjectActions.fetchProjectSuccess({ project });
            })
          );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public projectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.fetchProjectSuccess),
        tap(({ project }) => {
          this.navigationService.add(project);
        })
      );
    },
    { dispatch: false }
  );

  public loadMemberRoles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.initRolesPermissions),
      fetch({
        run: (action) => {
          return this.projectApiService
            .getMemberRoles(action.project.slug)
            .pipe(
              map((roles) => {
                return ProjectActions.fetchMemberRolesSuccess({ roles });
              })
            );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public loadPublicPermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.initRolesPermissions),
      fetch({
        run: (action) => {
          return this.projectApiService
            .getPublicPermissions(action.project.slug)
            .pipe(
              map((permissions) => {
                return ProjectActions.fetchPublicPermissionsSuccess({
                  permissions: permissions,
                });
              })
            );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public loadWorkspacePermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.initRolesPermissions),
      filter((action) => action.project.workspace.isPremium),
      fetch({
        run: (action) => {
          return this.projectApiService
            .getworkspacePermissions(action.project.slug)
            .pipe(
              map((permissions) => {
                return ProjectActions.fetchWorkspacePermissionsSuccess({
                  workspacePermissions: permissions,
                });
              })
            );
        },
        onError: () => {
          return null;
        },
      })
    );
  });

  public updateRolePermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updateRolePermissions),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .putMemberRoles(action.project, action.roleSlug, action.permissions)
            .pipe(
              map(() => {
                return ProjectActions.updateRolePermissionsSuccess();
              })
            );
        },
        onError: () => {
          return ProjectActions.updateRolePermissionsError();
        },
      })
    );
  });

  public updatePublicPermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updatePublicPermissions),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .putPublicPermissions(action.project, action.permissions)
            .pipe(
              map(() => {
                return ProjectActions.updateRolePermissionsSuccess();
              })
            );
        },
        onError: () => {
          return ProjectActions.updateRolePermissionsError();
        },
      })
    );
  });

  public updateWorkspacePermissions$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updateWorkspacePermissions),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .putworkspacePermissions(action.project, action.permissions)
            .pipe(
              map(() => {
                return ProjectActions.updateRolePermissionsSuccess();
              })
            );
        },
        onError: () => {
          return ProjectActions.updateRolePermissionsError();
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService
  ) {}
}
