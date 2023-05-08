/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { map } from 'rxjs/operators';
import { AppService } from '~/app/services/app.service';
import * as ProjectActions from '../actions/roles-permissions.actions';

@Injectable()
export class RolesPermissionsEffects {
  public loadMemberRoles$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.initRolesPermissions),
      fetch({
        run: (action) => {
          return this.projectApiService.getMemberRoles(action.project.id).pipe(
            map((roles) => {
              return ProjectActions.fetchMemberRolesSuccess({ roles });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.member_roles',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
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
            .getPublicPermissions(action.project.id)
            .pipe(
              map((permissions) => {
                return ProjectActions.fetchPublicPermissionsSuccess({
                  permissions: permissions,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.public_permissions',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
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
              map((role) => {
                return ProjectActions.updateRolePermissionsSuccess({ role });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.save_changes',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
          ProjectActions.updateRolePermissionsError();
          return ProjectActions.resetPermissionForm();
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
              map((permissions) => {
                return ProjectActions.updatePublicPermissionsSuccess({
                  permissions,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.save_changes',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
          ProjectActions.updateRolePermissionsError();
          return ProjectActions.resetPermissionForm();
        },
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService
  ) {}
}
