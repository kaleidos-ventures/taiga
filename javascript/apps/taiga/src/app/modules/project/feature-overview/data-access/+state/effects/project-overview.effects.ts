/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { EMPTY, of } from 'rxjs';
import { exhaustMap, map } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import {
  selectHasMoreInvitations,
  selectHasMoreMembers,
  selectInvitations,
  selectMembers,
} from '../selectors/project-overview.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';

@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      exhaustMap(([, project]) => {
        return this.projectApiService.getMembers(project.slug, 0).pipe(
          exhaustMap((membersResponse) => {
            return this.projectApiService
              .getInvitations(project.slug, 0, MEMBERS_PAGE_SIZE)
              .pipe(
                map((invitationsResponse) => {
                  return ProjectOverviewActions.fetchMembersSuccess({
                    invitations: invitationsResponse.invitations,
                    totalInvitations: invitationsResponse.totalInvitations,
                    members: membersResponse.memberships,
                    totalMemberships: membersResponse.totalMemberships,
                  });
                })
              );
          })
        );
      })
    );
  });

  public nextMembersPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.nextMembersPage),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
        this.store.select(selectInvitations),
        this.store.select(selectMembers),
        this.store.select(selectHasMoreInvitations),
        this.store.select(selectHasMoreMembers),
      ]),
      exhaustMap(
        ([
          ,
          project,
          invitations,
          members,
          hasMoreInvitations,
          hasMoreMembers,
        ]) => {
          if (hasMoreMembers) {
            return this.projectApiService
              .getMembers(project.slug, members.length)
              .pipe(
                exhaustMap((membersResponse) => {
                  if (
                    membersResponse.memberships.length === MEMBERS_PAGE_SIZE
                  ) {
                    return of(
                      ProjectOverviewActions.fetchMembersSuccess({
                        members: membersResponse?.memberships,
                        totalMemberships: membersResponse?.totalMemberships,
                      })
                    );
                  } else {
                    return this.projectApiService
                      .getInvitations(project.slug, invitations.length)
                      .pipe(
                        map((invitationsResponse) => {
                          return ProjectOverviewActions.fetchMembersSuccess({
                            invitations: invitationsResponse.invitations,
                            totalInvitations:
                              invitationsResponse.totalInvitations,
                            members: membersResponse.memberships,
                            totalMemberships: membersResponse.totalMemberships,
                          });
                        })
                      );
                  }
                })
              );
          } else if (hasMoreInvitations) {
            return this.projectApiService
              .getInvitations(project.slug, invitations.length)
              .pipe(
                map((invitationsResponse) => {
                  return ProjectOverviewActions.fetchMembersSuccess({
                    invitations: invitationsResponse?.invitations,
                    totalInvitations: invitationsResponse?.totalInvitations,
                  });
                })
              );
          }

          return EMPTY;
        }
      )
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService
  ) {}
}
