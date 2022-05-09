/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthApiService, ProjectApiService, UsersApiService } from '@taiga/api';
import { fetch, pessimisticUpdate } from '@nrwl/angular';
import { Auth, ErrorManagementOptions, SignUpError, User } from '@taiga/data';
import { Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/data-access/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TuiNotification } from '@taiga-ui/core';
import { Store } from '@ngrx/store';
import { selectUser } from '../selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import { EMPTY } from 'rxjs';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';

@Injectable()
export class AuthEffects {
  public login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      pessimisticUpdate({
        run: ({
          username,
          password,
          projectInvitationToken,
          next,
          acceptProjectInvitation,
        }) => {
          this.buttonLoadingService.start();
          return this.authApiService
            .login({
              username,
              password,
            })
            .pipe(
              switchMap(this.buttonLoadingService.waitLoading()),
              map((auth: Auth) => {
                return AuthActions.loginSuccess({
                  auth,
                  projectInvitationToken,
                  next,
                  acceptProjectInvitation,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();

          this.appService.errorManagement(httpResponse, {
            500: {
              type: 'toast',
              options: {
                label: 'errors.login',
                message: 'errors.please_refresh',
                status: TuiNotification.Error,
              },
            },
          });
          return AuthActions.setLoginError({ loginError: true });
        },
      })
    );
  });

  public loginSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      fetch({
        run: ({ auth }) => {
          this.authService.setAuth(auth);
          return this.usersApiService.me().pipe(
            map((user: User) => {
              return AuthActions.setUser({ user });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public loginRedirect$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        switchMap(
          ({ next, projectInvitationToken, acceptProjectInvitation }) => {
            return this.store
              .select(selectUser)
              .pipe(filterNil())
              .pipe(
                mergeMap(() => {
                  if (
                    projectInvitationToken &&
                    next &&
                    acceptProjectInvitation
                  ) {
                    return this.projectApiService
                      .acceptInvitationToken(projectInvitationToken)
                      .pipe(
                        tap(() => {
                          void this.router.navigateByUrl(next);
                          return EMPTY;
                        })
                      );
                  } else if (
                    projectInvitationToken &&
                    next &&
                    !acceptProjectInvitation
                  ) {
                    void this.router.navigateByUrl(next);
                    return EMPTY;
                  } else if (!projectInvitationToken && next) {
                    void this.router.navigateByUrl(next);
                    return EMPTY;
                  } else {
                    void this.router.navigate(['/']);
                    return EMPTY;
                  }
                })
              );
          }
        )
      );
    },
    { dispatch: false }
  );

  public logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => {
        const refresh = this.authService.getAuth()?.refresh;
        this.authApiService.denyRefreshToken(refresh).subscribe();
        void this.authService.logout();
        void this.router.navigate(['/login']);
        const data = {
          label: 'logout.logged_out',
          message: 'logout.see_you_soon',
          status: TuiNotification.Success,
          scope: 'auth',
          autoClose: true,
        };
        void this.appService.toastNotification(data);
        return AuthActions.setUser({ user: null });
      })
    );
  });

  public setUser$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.setUser),
        tap(({ user }) => {
          if (user) {
            this.authService.setUser(user);
          }
        })
      );
    },
    { dispatch: false }
  );

  public signUp$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signup),
      pessimisticUpdate({
        run: ({
          email,
          password,
          fullName,
          acceptTerms,
          resend,
          acceptProjectInvitation,
          projectInvitationToken,
        }) => {
          return this.authApiService
            .signUp({
              email,
              password,
              fullName,
              acceptTerms,
              acceptProjectInvitation,
              projectInvitationToken,
            })
            .pipe(
              map(() => {
                if (!resend) {
                  return AuthActions.signUpSuccess({ email });
                } else {
                  return AuthActions.resendSuccess();
                }
              })
            );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          const status = httpResponse.status as keyof ErrorManagementOptions;
          const signUpError = httpResponse.error as SignUpError;
          if (
            status === 400 &&
            signUpError.error.message !== 'Email already exists'
          ) {
            this.appService.errorManagement(httpResponse, {
              400: {
                type: 'toast',
                options: {
                  label: 'signup.errors.register',
                  message: 'signup.errors.please_refresh',
                  status: TuiNotification.Error,
                  scope: 'auth',
                },
              },
            });
          }
          if (status === 400 && action.resend) {
            this.appService.errorManagement(httpResponse, {
              400: {
                type: 'toast',
                options: {
                  label: 'signup.errors.resend_email_label',
                  message: 'signup.errors.resend_email_message',
                  status: TuiNotification.Error,
                  scope: 'auth',
                },
              },
            });
          }
          return AuthActions.signUpError({ response: httpResponse });
        },
      })
    );
  });

  public resendSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.resendSuccess),
        tap(() => {
          this.appService.toastNotification({
            label: 'signup.resend_email_label',
            message: 'signup.resend_email_message',
            status: TuiNotification.Success,
            scope: 'auth',
            autoClose: true,
          });
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private buttonLoadingService: ButtonLoadingService,
    private router: Router,
    private actions$: Actions,
    private authApiService: AuthApiService,
    private authService: AuthService,
    private usersApiService: UsersApiService,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private store: Store
  ) {}
}
