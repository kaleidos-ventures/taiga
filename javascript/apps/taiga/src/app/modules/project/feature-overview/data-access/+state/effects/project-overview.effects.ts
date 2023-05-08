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
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectApiService } from '@taiga/api';
import { exhaustMap, filter, map, tap } from 'rxjs/operators';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectRouteParams } from '~/app/router-selectors';
import { AppService } from '~/app/services/app.service';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        ProjectOverviewActions.initMembers,
        ProjectOverviewActions.updateInvitationsList,
        ProjectActions.newProjectMembers
      ),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      exhaustMap(([, project]) => {
        return this.projectApiService.getAllInvitations(project.id).pipe(
          map((invitationsResponse) => {
            return ProjectOverviewActions.fetchInvitationsSuccess({
              invitations: invitationsResponse,
            });
          })
        );
      })
    );
  });

  public udpateMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectActions.projectEventActions.updateMember),
      concatLatestFrom(() => [
        this.store.select(selectUser).pipe(filterNil()),
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      filter(([action, user, project]) => {
        return (
          action.membership.role.isAdmin !== project.userIsAdmin &&
          action.membership.user.username === user.username
        );
      }),
      map(() => {
        return ProjectOverviewActions.updateInvitationsList();
      })
    );
  });

  public acceptInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        invitationProjectActions.acceptInvitationIdSuccess,
        invitationProjectActions.inviteUsersSuccess
      ),
      map(() => {
        return ProjectOverviewActions.updateInvitationsList();
      })
    );
  });

  public formUpdateProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.editProject),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService.editProject(action.project).pipe(
            map((project) => {
              return ProjectOverviewActions.editProjectSuccess({ project });
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

  public updateUrlOnEditProjectSuccess$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ProjectOverviewActions.editProjectSuccess),
        concatLatestFrom(() => this.store.select(selectRouteParams)),
        filter(([{ project }, router]) => {
          return project.id === router.id && router.slug !== project.slug;
        }),
        tap(([{ project }]) => {
          this.location.replaceState(`project/${project.id}/${project.slug}`);
        })
      );
    },
    { dispatch: false }
  );

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private location: Location
  ) {}
}
