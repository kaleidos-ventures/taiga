/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, concatLatestFrom } from '@ngrx/effects';

import { filter, map, switchMap, tap } from 'rxjs/operators';

import * as ProjectActions from '../actions/project.actions';
import { ProjectApiService } from '@taiga/api';
import { fetch } from '@nrwl/angular';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
import { AppService } from '~/app/services/app.service';
import { HttpErrorResponse } from '@angular/common/http';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { TuiNotification } from '@taiga-ui/core';
import { WsService } from '~/app/services/ws';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

import { selectCurrentProject } from '../selectors/project.selectors';

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

  public wsUpdateInvitations$ = createEffect(() => {
    return this.store.select(selectUser).pipe(
      filterNil(),
      switchMap((user) => {
        return this.wsService
          .events<{ project: string }>({
            channel: `users.${user.username}`,
            type: 'projectinvitations.create',
          })
          .pipe(
            concatLatestFrom(() =>
              this.store.select(selectCurrentProject).pipe(filterNil())
            ),
            filter(
              ([eventResponse, project]) =>
                eventResponse.event.content.project === project.slug
            ),
            map(() => {
              return ProjectActions.eventInvitation();
            })
          );
      })
    );
  });

  constructor(
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private navigationService: NavigationService,
    private appService: AppService,
    private wsService: WsService,
    private store: Store
  ) {}
}
