/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { pessimisticUpdate } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { AuthApiService, ProjectApiService, UsersApiService } from '@taiga/api';
import { Auth, ErrorManagementOptions, SignUpError } from '@taiga/data';
import { EMPTY, throwError } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { ButtonLoadingService } from '~/app/shared/directives/button-loading/button-loading.service';
import { filterNil } from '~/app/shared/utils/operators';
import * as AuthActions from '../actions/auth.actions';
import { selectUser } from '../selectors/auth.selectors';

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
          invitationStatus,
          nextProjectId,
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
                  invitationStatus,
                  nextProjectId,
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
          ({
            next,
            projectInvitationToken,
            acceptProjectInvitation,
            invitationStatus,
            nextProjectId,
          }) => {
            return this.store.select(selectUser).pipe(
              filterNil(),
              take(1),
              mergeMap(() => {
                if (projectInvitationToken && acceptProjectInvitation) {
                  return this.projectApiService
                    .acceptInvitationToken(projectInvitationToken)
                    .pipe(
                      map((invitation) => {
                        if (next) {
                          void this.router.navigate([next], {
                            state: { invite: invitationStatus },
                          });
                        } else if (invitation.project) {
                          void this.router.navigate(
                            [
                              `project/${invitation.project.id}/${invitation.project.slug}`,
                            ],
                            {
                              state: { invite: invitationStatus },
                            }
                          );
                        } else {
                          void this.router.navigate(['/'], {
                            state: { invite: invitationStatus },
                          });
                        }
                        return EMPTY;
                      }),
                      catchError((httpResponse: HttpErrorResponse) => {
                        const error = httpResponse;
                        if (nextProjectId) {
                          return this.projectApiService
                            .getProject(nextProjectId)
                            .pipe(
                              tap((project) => {
                                this.revokeInvitationService.acceptInvitationTokenRevokeError(
                                  error,
                                  next || '/',
                                  !!project.userPermissions.length
                                );
                                return EMPTY;
                              }),
                              catchError((httpResponse: HttpErrorResponse) => {
                                this.revokeInvitationService.acceptInvitationTokenRevokeError(
                                  error,
                                  next || '/',
                                  false
                                );
                                return throwError(() => httpResponse);
                              })
                            );
                        } else {
                          void this.router.navigate(['/'], {
                            state: { invite: invitationStatus },
                          });
                        }

                        return EMPTY;
                      })
                    );
                } else if (
                  projectInvitationToken &&
                  next &&
                  !acceptProjectInvitation
                ) {
                  void this.router.navigate([next], {
                    state: { invite: invitationStatus },
                  });
                  return EMPTY;
                } else if (!projectInvitationToken && next) {
                  void this.router.navigate([next], {
                    state: { invite: invitationStatus },
                  });
                  return EMPTY;
                } else {
                  void this.router.navigate(['/'], {
                    state: { invite: invitationStatus },
                  });
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

  public logout$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          const refresh = this.authService.getAuth()?.refresh;
          this.authApiService.denyRefreshToken(refresh).subscribe();
          void this.authService.logout();

          const data = {
            label: 'logout.logged_out',
            message: 'logout.see_you_soon',
            status: TuiNotification.Success,
            scope: 'auth',
            autoClose: false,
          };

          this.router.events
            .pipe(
              filter(
                (evt): evt is NavigationEnd => evt instanceof NavigationEnd
              ),
              take(1)
            )
            .subscribe(() => {
              void this.appService.toastNotification(data);
            });

          void this.router.navigate(['/login']);
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
          this.buttonLoadingService.start();
          return this.authService.getUserRegistrationLang().pipe(
            switchMap((lang) => {
              return this.authApiService
                .signUp({
                  email,
                  password,
                  fullName,
                  acceptTerms,
                  acceptProjectInvitation,
                  projectInvitationToken,
                  lang: lang.code,
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
        run: ({
          code,
          social,
          projectInvitationToken,
          acceptProjectInvitation,
        }) => {
          return this.authService.getUserRegistrationLang().pipe(
            switchMap((lang) => {
              return this.authApiService
                .socialSignUp(code, social, lang.code)
                .pipe(
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
                    const loginData = {
                      user,
                      auth,
                      acceptProjectInvitation,
                      projectInvitationToken,
                    };
                    return AuthActions.loginSuccess(loginData);
                  })
                );
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
              'google-api-error',
              'github-login-authentication-error',
              'gitlab-login-authentication-error',
              'google-login-authentication-error',
            ];
            const configErrorMessages = [
              'github-login-error',
              'gitlab-login-error',
              'google-login-error',
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
    private store: Store,
    private revokeInvitationService: RevokeInvitationService
  ) {}
}
