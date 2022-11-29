/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { Project } from '@taiga/data';
import { map, switchMap } from 'rxjs/operators';
import * as NewProjectActions from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { AppService } from '~/app/services/app.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';

@Injectable()
export class NewProjectEffects {
  public createProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(NewProjectActions.createProject),
      pessimisticUpdate({
        run: (action) => {
          this.buttonLoadingService.start();

          return this.projectApiService.createProject(action.project).pipe(
            switchMap(this.buttonLoadingService.waitLoading()),
            map((project: Project) => {
              return NewProjectActions.createProjectSuccess({ project });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();

          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.create_project',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
          return NewProjectActions.createProjectError({
            error: httpResponse,
          });
        },
      })
    );
  });

  public createProjectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(NewProjectActions.createProjectSuccess),
        map((action) => {
          void this.router.navigate(
            ['/project/', action.project.id, action.project.slug, 'kanban'],
            {
              state: { invite: true },
            }
          );
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private buttonLoadingService: ButtonLoadingService,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private router: Router,
    private appService: AppService
  ) {}
}
