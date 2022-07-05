/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthApiService, ProjectApiService, UsersApiService } from '@taiga/api';
import { pessimisticUpdate } from '@nrwl/angular';
import { Auth, ErrorManagementOptions, SignUpError } from '@taiga/data';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '~/app/modules/auth/services/auth.service';
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
              mergeMap((auth: Auth) => {
                this.authService.setAuth(auth);
                return this.usersApiService.me().pipe(
                  map((user) => {
                    this.authService.setUser(user);
                    return { user, auth };
                  })
                );
              }),
              map(({ user, auth }) => {
                return AuthActions.loginSuccess({
                  user,
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
                      .acceptInvitationSlug(projectInvitationToken)
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
          this.buttonLoadingService.start();
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
              switchMap(this.buttonLoadingService.waitLoading()),
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
          this.buttonLoadingService.error();

          const status = httpResponse.status as keyof ErrorManagementOptions;
          const signUpError = httpResponse.error as SignUpError;
          if (
            status === 400 &&
            signUpError.error.msg !== 'Email already exists'
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

  public requestResendPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.requestResetPassword),
      pessimisticUpdate({
        run: ({ email }) => {
          this.buttonLoadingService.start();
          return this.usersApiService.requestResetPassword(email).pipe(
            switchMap(this.buttonLoadingService.waitLoading()),
            map(() => {
              return AuthActions.requestResetPasswordSuccess();
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();

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

          return AuthActions.requestResetPasswordError();
        },
      })
    );
  });

  public newPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.newPassword),
      pessimisticUpdate({
        run: ({ token, password }) => {
          this.buttonLoadingService.start();

          return this.usersApiService.newPassword(token, password).pipe(
            mergeMap((auth: Auth) => {
              this.authService.setAuth(auth);
              return this.usersApiService.me().pipe(
                map((user) => {
                  this.authService.setUser(user);
                  return { user, auth };
                })
              );
            }),
            switchMap(this.buttonLoadingService.waitLoading()),
            map(({ user, auth }) => {
              this.router.events
                .pipe(
                  filter(
                    (evt: unknown): evt is NavigationEnd =>
                      evt instanceof NavigationEnd
                  ),
                  take(1)
                )
                .subscribe(() => {
                  this.appService.toastNotification({
                    label: 'reset_password.reset_success',
                    message: '',
                    status: TuiNotification.Success,
                    scope: 'auth',
                    autoClose: true,
                  });
                });

              return AuthActions.loginSuccess({ user, auth });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.buttonLoadingService.error();

          if (httpResponse.status === 400) {
            void this.router.navigate([
              '/reset-password',
              { expiredToken: true },
            ]);
          } else {
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
          }

          return AuthActions.newPasswordError({ status: httpResponse.status });
        },
      })
    );
  });

  public socialSignUp$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.socialSignup),
      pessimisticUpdate({
        run: ({ code, social }) => {
          return this.authApiService.socialSignUp(code, social).pipe(
            mergeMap((auth: Auth) => {
              this.authService.setAuth(auth);
              return this.usersApiService.me().pipe(
                map((user) => {
                  this.authService.setUser(user);
                  return { user, auth };
                })
              );
            }),
            map(({ user, auth }) => {
              return AuthActions.loginSuccess({
                user,
                auth,
              });
            })
          );
        },
        onError: (action, httpResponse: HttpErrorResponse) => {
          const status = httpResponse.status as keyof ErrorManagementOptions;
          const signUpError = httpResponse.error as SignUpError;

          if (status == 400 && signUpError.error.detail) {
            const serverErrorMessages = [
              'github-api-error',
              'gitlab-api-error',
              'github-login-authentication-error',
              'gitlab-login-authentication-error',
            ];
            const configErrorMessages = [
              'github-login-error',
              'gitlab-login-error',
            ];

            if (
              serverErrorMessages.includes(signUpError.error.detail as string)
            ) {
              void this.router.navigate([action.redirect], {
                queryParams: { socialError: 'server', social: action.social },
              });
            } else if (
              configErrorMessages.includes(signUpError.error.detail as string)
            ) {
              void this.router.navigate([action.redirect], {
                queryParams: { socialError: 'config', social: action.social },
              });
            }
          } else {
            void this.router.navigate([action.redirect]);
            this.appService.errorManagement(httpResponse, {
              500: {
                type: 'toast',
                options: {
                  label: 'errors.generic_toast_label',
                  message: 'errors.please_refresh',
                  status: TuiNotification.Error,
                },
              },
            });
          }
          return AuthActions.signUpError({ response: httpResponse });
        },
      })
    );
  });

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
