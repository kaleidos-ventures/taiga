/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { UsersApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import {
  userSettingsActions,
  userSettingsApiActions,
} from '../actions/user-settings.actions';
import { EMPTY, catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AppService } from '~/app/services/app.service';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { Router } from '@angular/router';
import { LanguageService } from '~/app/services/language/language.service';

@Injectable()
export class UserSettingsEffects {
  public loadLanguages$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(userSettingsActions.initPreferences),
      concatLatestFrom(() => [this.languageService.getLanguages()]),
      fetch({
        run: (_, languages) => {
          return userSettingsApiActions.fetchLanguagesSuccess({
            languages,
          });
        },
        onError: (action, error: HttpErrorResponse) => {
          return this.appService.errorManagement(error);
        },
      })
    );
  });

  public newLanguage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(userSettingsActions.newLanguage),
      concatLatestFrom(() => [this.store.select(selectUser).pipe(filterNil())]),
      pessimisticUpdate({
        run: ({ lang }, user) => {
          return this.usersApiService
            .updateUser({ fullName: user.fullName, lang: lang.code })
            .pipe(
              map(() => {
                this.authService.patchUser({ lang: lang.code });
                return userSettingsApiActions.updateUserLanguageSuccess({
                  lang: lang.code,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          return this.appService.errorManagement(httpResponse, {
            any: {
              type: 'toast',
              options: {
                label: 'errors.save_changes',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
        },
      })
    );
  });

  public initDeleteAccount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(userSettingsActions.initDeleteAcccount),
      exhaustMap(() => {
        return this.usersApiService.deleteAccountInfo().pipe(
          switchMap((deleteUserInfo) => {
            if (
              deleteUserInfo.projects.length ||
              deleteUserInfo.workspaces.length
            ) {
              return of(
                userSettingsActions.showDeleteAccountModal({
                  projects: deleteUserInfo.projects,
                  workspaces: deleteUserInfo.workspaces,
                })
              );
            }

            return this.usersApiService.deleteAccount().pipe(
              map(() => {
                return userSettingsApiActions.deleteUserSuccess();
              })
            );
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.appService.errorManagement(error);

        return EMPTY;
      })
    );
  });

  public confirmDeleteAccount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(userSettingsActions.confirmDeleteAccount),
      exhaustMap(() => {
        return this.usersApiService.deleteAccount().pipe(
          map(() => {
            return userSettingsApiActions.deleteUserSuccess();
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.appService.errorManagement(error);

        return EMPTY;
      })
    );
  });

  public deleteUserSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(userSettingsApiActions.deleteUserSuccess),
        tap(() => {
          this.authService.logout();

          void this.router.navigate(['/signup'], {
            queryParams: {
              deletedAccount: true,
            },
          });
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private store: Store,
    private authService: AuthService,
    private appService: AppService,
    private actions$: Actions,
    private usersApiService: UsersApiService,
    private router: Router,
    private languageService: LanguageService
  ) {}
}
