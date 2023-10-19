/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { fetch, pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { Store } from '@ngrx/store';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { EMPTY, of } from 'rxjs';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { selectRouteParams, selectUrl } from '~/app/router-selectors';
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
        return ProjectOverviewActions.updateInvitationsList();
      })
    );
  });

  public acceptedInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(invitationProjectActions.acceptInvitationIdSuccess),
      tap(({ projectName }) => {
        this.appService.toastNotification({
          message: 'invitation_accept_message',
          paramsMessage: {
            project: projectName,
          },
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

  public createWorkflow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.createWorkflow),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .createWorkflow(action.name, project.id)
            .pipe(
              map((newWorkflow) => {
                void this.router.navigate([
                  '/project',
                  project.id,
                  project.slug,
                  'kanban',
                  newWorkflow.slug,
                ]);
                return ProjectActions.projectApiActions.createWorkflowSuccess({
                  workflow: newWorkflow,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 400) {
            this.appService.toastNotification({
              message: 'create_workflow.max_workflow_created',
              status: TuiNotification.Error,
              scope: 'kanban',
              closeOnNavigation: false,
            });
            return ProjectActions.projectApiActions.createWorkflowError();
          } else {
            return this.appService.errorManagement(httpResponse);
          }
        },
      })
    );
  });

  public updateWorkflow$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.updateWorkflow),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      pessimisticUpdate({
        run: (action, project) => {
          return this.projectApiService
            .updateWorkflow(action.name, action.slug, project.id)
            .pipe(
              map((updatedWorkflow) => {
                this.location.go(
                  `project/${project.id}/${project.slug}/kanban/${updatedWorkflow.slug}`
                );
                return ProjectActions.projectApiActions.updateWorkflowSuccess({
                  workflow: updatedWorkflow,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          return this.appService.errorManagement(httpResponse);
        },
      })
    );
  });

  public updateWorkflowSlug$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(projectEventActions.updateWorkflow),
        concatLatestFrom(() => [
          this.store.select(selectRouteParams).pipe(filterNil()),
        ]),
        filter(([action, params]) => params.workflow !== action.workflow.slug),
        tap(([action, params]) => {
          const paramWorkflow = params.workflow as string;

          void this.location.go(
            this.router.url.replace(
              `kanban/${paramWorkflow}`,
              `kanban/${action.workflow.slug}`
            )
          );
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
          return this.projectApiService.getMembers(project.id).pipe(
            map((members) => {
              return ProjectActions.fetchProjectMembersSuccess({
                members: members.memberships,
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
      ofType(
        ProjectActions.fetchProjectSuccess,
        ProjectActions.fetchProjectMembers
      ),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectMembers),
      ]),
      fetch({
        run: (_, project) => {
          return this.projectApiService.getMembers(project.id).pipe(
            map((members) => {
              return ProjectActions.fetchProjectMembersSuccess({
                members: members.memberships,
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
      map(() => {
        return ProjectActions.fetchProjectMembers();
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
        onError: (action, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status === 403) {
            this.appService.toastNotification({
              message: 'errors.admin_permission',
              paramsMessage: {
                project: action.name,
              },
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
            autoClose: !action.error,
          });
        })
      );
    },
    { dispatch: false }
  );

  public userLostProjectMembership$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(projectEventActions.userLostProjectMembership),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectUrl),
      ]),
      switchMap(([action, project, url]) =>
        this.projectApiService.getProject(project.id).pipe(
          map((project) => {
            if (action.isSelf) {
              this.appService.toastNotification({
                message: 'common_members_tabs.no_longer_member',
                paramsMessage: { name: action.projectName, type: 'project' },
                status: TuiNotification.Error,
                closeOnNavigation: false,
                autoClose: false,
              });

              if (!url.includes('/kanban') && !url.includes('/stories/')) {
                void this.router.navigate([
                  'project',
                  project.id,
                  project.slug,
                  'overview',
                ]);
              }
            }
            return ProjectActions.fetchProjectSuccess({ project });
          }),
          catchError(() => {
            if (action.isSelf) {
              this.appService.toastNotification({
                message: 'common_members_tabs.no_longer_member',
                paramsMessage: { name: action.projectName, type: 'project' },
                status: TuiNotification.Error,
                closeOnNavigation: false,
                autoClose: false,
              });
              void this.router.navigate(['/']);
            }
            return EMPTY;
          })
        )
      )
    );
  });

  public userLostWorkspaceMembership$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(projectEventActions.userLostWorkspaceMembership),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      map(([action, project]) => {
        this.appService.toastNotification({
          message: 'common_members_tabs.no_longer_member',
          paramsMessage: { name: action.workspaceName, type: 'workspace' },
          status: TuiNotification.Error,
          closeOnNavigation: false,
        });

        return ProjectActions.fetchProject({ id: project.id });
      })
    );
  });

  public leaveProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.leaveProject),
      concatLatestFrom(() => this.store.select(selectUser).pipe(filterNil())),
      pessimisticUpdate({
        run: (action, user) => {
          return this.projectApiService
            .deleteProjectMembership(action.id, user.username)
            .pipe(
              exhaustMap(() => {
                return this.projectApiService.getProject(action.id).pipe(
                  map((project) => {
                    return ProjectActions.leaveProjectSuccess({
                      id: action.id,
                      name: action.name,
                      refreshProject: project,
                    });
                  }),
                  catchError(() => {
                    return of(
                      ProjectActions.leaveProjectSuccess({
                        id: action.id,
                        name: action.name,
                        refreshProject: null,
                      })
                    );
                  })
                );
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.errorManagement(httpResponse);
        },
      })
    );
  });

  public leaveProjectSucces$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.leaveProjectSuccess),
      tap((action) => {
        this.appService.toastNotification({
          message: 'project.leave_project.no_longer_member',
          paramsMessage: { project: action.name },
          status: TuiNotification.Info,
          closeOnNavigation: false,
          autoClose: true,
        });

        if (!action.refreshProject) {
          void this.router.navigate(['/']);
        }
      }),
      map((action) => {
        return action.refreshProject;
      }),
      filterNil(),
      map((project) => {
        return ProjectActions.fetchProjectSuccess({
          project,
        });
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService,
    private appService: AppService,
    private router: Router,
    private revokeInvitationService: RevokeInvitationService,
    private store: Store,
    private location: Location,
    private route: ActivatedRoute
  ) {}
}
