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
import { Store } from '@ngrx/store';
import { fetch } from '@nrwl/angular';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { EMPTY } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import * as ProjectOverviewActions from '~/app/modules/project/feature-overview/data-access/+state/actions/project-overview.actions';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { WsService } from '~/app/services/ws';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
import * as ProjectActions from '../actions/project.actions';

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
      ofType(InvitationActions.acceptInvitationSlugSuccess),
      tap(() => {
        this.appService.toastNotification({
          message: 'invitation_accept_message',
          status: TuiNotification.Success,
          scope: 'invitation_modal',
          autoClose: true,
        });
      }),
      map(({ projectSlug }) => {
        return ProjectActions.fetchProject({ slug: projectSlug });
      })
    );
  });

  public acceptedInvitationError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.acceptInvitationSlugError),
      map(({ projectSlug }) => {
        return ProjectActions.fetchProject({ slug: projectSlug });
      })
    );
  });

  public revokeInvitationBannerSlugError$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.revokeInvitationBannerSlugError),
      fetch({
        run: ({ projectSlug }) => {
          return this.projectApiService.getProject(projectSlug).pipe(
            map((project) => {
              return ProjectActions.fetchProject({ slug: project.slug });
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

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService,
    private appService: AppService,
    private wsService: WsService,
    private store: Store,
    private router: Router,
    private revokeInvitationService: RevokeInvitationService
  ) {}
}
