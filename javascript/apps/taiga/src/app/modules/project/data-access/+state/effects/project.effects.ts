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
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { fetch } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { EMPTY } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  selectCurrentProject,
  selectCurrentStory,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { WsService } from '~/app/services/ws';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectActions from '../actions/project.actions';
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
              return ProjectActions.fetchProjectSuccess({ project });
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
      ofType(InvitationActions.acceptInvitationIdSuccess),
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
      ofType(InvitationActions.acceptInvitationIdError),
      map(({ projectId }) => {
        return ProjectActions.fetchProject({ id: projectId });
      })
    );
  });

  public revokeInvitationBannerIdError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.revokeInvitationBannerIdError),
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

  public loadStoryDetail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.fetchStory),

      fetch({
        run: (action) => {
          return this.projectApiService
            .getStory(action.projectId, action.storyRef)
            .pipe(
              map((story) => {
                return ProjectActions.fetchStorySuccess({
                  story,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) =>
          this.appService.errorManagement(httpResponse),
      })
    );
  });

  public updateStoryViewMode$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectActions.updateStoryViewMode),
        concatLatestFrom(() => [
          this.store.select(selectCurrentProject).pipe(filterNil()),
          this.store.select(selectCurrentStory).pipe(filterNil()),
        ]),
        map(([action, project, story]) => {
          this.localStorage.set('story_view', action.storyView);
          void this.router.navigate([
            `/project/${project.id}/${project.slug}/stories/${story.ref}`,
          ]);
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService,
    private appService: AppService,
    private wsService: WsService,
    private store: Store,
    private router: Router,
    private revokeInvitationService: RevokeInvitationService,
    private localStorage: LocalStorageService
  ) {}
}
