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
import { delay, exhaustMap, map } from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import * as InvitationActions from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { WaitingForToastNotification } from '~/app/modules/project/feature-overview/project-feature-overview.animation-timing';
import {
  selectHasMoreInvitations,
  selectHasMoreMembers,
  selectInvitations,
  selectMembers,
} from '../selectors/project-overview.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';
import { WsService } from '@taiga/ws';

@Injectable()
export class ProjectOverviewEffects {
  public acceptedInvitation$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(InvitationActions.acceptInvitationSlugSuccess),
      delay(WaitingForToastNotification),
      map(() => {
        return ProjectOverviewActions.onAcceptedInvitation({
          onAcceptedInvitation: true,
        });
      })
    );
  });

  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      exhaustMap(([, project]) => {
        return this.projectApiService.getMembers(project.slug, 0).pipe(
          exhaustMap((membersResponse) => {
            // only request invitations if there are not enough members
            const invitations =
              membersResponse.totalMemberships > MEMBERS_PAGE_SIZE
                ? 0
                : MEMBERS_PAGE_SIZE;

            return this.projectApiService
              .getInvitations(project.slug, 0, invitations)
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

  public wsUpdateInvitations$ = createEffect(() => {
    return this.wsService
      .events<{ project: string }>({ type: 'invitations.create' })
      .pipe(
        map(() => {
          return ProjectOverviewActions.eventInvitation();
        })
      );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private wsService: WsService
  ) {}
}
