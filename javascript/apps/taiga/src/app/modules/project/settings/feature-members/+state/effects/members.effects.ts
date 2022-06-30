/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { ProjectApiService } from '@taiga/api';
import { EMPTY } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/settings/feature-members/feature-members.constants';
import { AppService } from '~/app/services/app.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  initMembersPage,
  fetchMembersSuccess,
  fetchInvitationsSuccess,
  setPendingPage,
  setMembersPage,
} from '../actions/members.actions';

@Injectable()
export class MembersEffects {
  public nextMembersPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(setMembersPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),

      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getMembers(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((membersResponse) => {
              return fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                offset: action.offset,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public nextPendingPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(setPendingPage),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([action, project]) => {
        return this.projectApiService
          .getInvitations(project.slug, action.offset, MEMBERS_PAGE_SIZE)
          .pipe(
            map((invitationsResponse) => {
              return fetchInvitationsSuccess({
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                offset: action.offset,
              });
            }),
            catchError((httpResponse: HttpErrorResponse) => {
              this.appService.errorManagement(httpResponse);
              return EMPTY;
            })
          );
      })
    );
  });

  public initMembersTabPending$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(initMembersPage),
      map(() => {
        return setPendingPage({ offset: 0 });
      })
    );
  });

  public initMembersTabMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(initMembersPage),
      map(() => {
        return setMembersPage({ offset: 0 });
      })
    );
  });

  constructor(
    private appService: AppService,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private store: Store
  ) {}
}
