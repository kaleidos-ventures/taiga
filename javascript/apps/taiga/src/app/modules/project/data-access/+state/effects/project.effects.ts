/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fetch } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { EMPTY } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectActions from '../actions/project.actions';
import { projectEventActions } from '../actions/project.actions';
import {
  selectCurrentProject,
  selectMembers,
} from '../selectors/project.selectors';
@Injectable()
export class ProjectEffects {
  public loadProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchProject),
      fetch({
        run: (action) => {
          return this.projectApiService.getProject(action.id).pipe(
            map((project) => {
              return ProjectActions.fetchProjectSuccess({ project });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
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

  public permissionsUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.permissionsUpdate),
      fetch({
        run: (action) => {
          return this.projectApiService.getProject(action.id).pipe(
            map((project) => {
              return ProjectActions.permissionsUpdateSuccess({ project });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 403) {
            void this.router.navigate(['/']);
          }

          return this.appService.errorManagement(httpResponse, {
            403: {
              type: 'toast',
              options: {
                label: '',
                message: 'errors.you_dont_have_permission_to_see',
                status: TuiNotification.Error,
                closeOnNavigation: false,
              },
            },
          });
        },
      })
    );
  });

  public revokedInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.revokedInvitation),
      map(() => {
        return ProjectOverviewActions.updateMembersList();
      })
    );
  });

  public acceptedInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.acceptInvitationIdSuccess),
      tap(() => {
        this.appService.toastNotification({
          message: 'invitation_accept_message',
          status: TuiNotification.Success,
          scope: 'invitation_modal',
          autoClose: true,
        });
      }),
      map(({ projectId }) => {
        return ProjectActions.fetchProject({ id: projectId });
      })
    );
  });

  public acceptedInvitationError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.acceptInvitationIdError),
      map(({ projectId }) => {
        return ProjectActions.fetchProject({ id: projectId });
      })
    );
  });

  public revokeInvitationBannerIdError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.revokeInvitationBannerIdError),
      fetch({
        run: ({ projectId }) => {
          return this.projectApiService.getProject(projectId).pipe(
            map((project) => {
              return ProjectActions.fetchProject({ id: project.id });
            })
          );
        },
        onError: () => {
          void this.router.navigate(['/']);
          return EMPTY;
        },
      })
    );
  });

  public revokedNoPermissionInvitation$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.revokedNoPermissionInvitation),
        tap(() => {
          this.revokeInvitationService.wsRevokedInvitationError();
        })
      );
    },
    { dispatch: false }
  );

  public initAssignUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.initAssignUser),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembers),
      ]),
      filter(([, , members]) => {
        return !members.length;
      }),
      fetch({
        run: (_, project) => {
          return this.projectApiService.getAllMembers(project.id).pipe(
            map((members) => {
              return ProjectActions.fetchProjectMembersSuccess({
                members,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public fetchProjectMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(KanbanActions.initKanban, ProjectActions.fetchProjectMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembers),
      ]),
      fetch({
        run: (_, project) => {
          return this.projectApiService.getAllMembers(project.id).pipe(
            map((members) => {
              return ProjectActions.fetchProjectMembersSuccess({
                members,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public newMembersEvent = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.newProjectMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembers),
      ]),
      filter(([, , members]) => {
        // do not fill if fetchProjectUsersSuccess hasn't been called
        return !!members.length;
      }),
      fetch({
        run: (_, project) => {
          return this.projectApiService.getAllMembers(project.id).pipe(
            map((members) => {
              return ProjectActions.fetchProjectMembersSuccess({
                members,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public deleteProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.deleteProject),
      fetch({
        run: (action) => {
          return this.projectApiService.deleteProject(action.id).pipe(
            map(() => {
              return ProjectActions.deleteProjectSuccess({
                name: action.name,
              });
            })
          );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 403) {
            this.appService.toastNotification({
              message: 'errors.admin_permission',
              status: TuiNotification.Error,
            });
          } else {
            this.appService.toastSaveChangesError(httpResponse);
          }
        },
      })
    );
  });

  public deleteProjectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(
          ProjectActions.deleteProjectSuccess,
          projectEventActions.projectDeleted
        ),
        tap((action) => {
          void this.router.navigate(['/']);
          void this.appService.toastNotification({
            message: 'errors.deleted_project',
            paramsMessage: { name: action.name },
            status: action.error ? TuiNotification.Error : TuiNotification.Info,
          });
        })
      );
    },
    { dispatch: false }
  );

  public userLostProjectMembership$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(projectEventActions.userLostProjectMembership),
        concatLatestFrom(() =>
          this.store.select(selectCurrentProject).pipe(filterNil())
        ),
        switchMap(([action, project]) =>
          this.projectApiService.getProject(project.id).pipe(
            map((project) => {
              if (action.isSelf) {
                this.appService.toastNotification({
                  message: 'common_members_tabs.no_longer_member',
                  paramsMessage: { project_name: action.projectName },
                  status: TuiNotification.Info,
                  closeOnNavigation: false,
                });
                return this.router.navigate([
                  'project',
                  project.id,
                  project.slug,
                ]);
              }
              return EMPTY;
            }),
            catchError(() => {
              if (action.isSelf) {
                this.appService.toastNotification({
                  message: 'common_members_tabs.no_longer_member',
                  paramsMessage: { project_name: action.projectName },
                  status: TuiNotification.Info,
                  closeOnNavigation: false,
                });
                return this.router.navigate(['/']);
              }
              return EMPTY;
            })
          )
        )
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService,
    private appService: AppService,
    private router: Router,
    private revokeInvitationService: RevokeInvitationService,
    private store: Store
  ) {}
}
