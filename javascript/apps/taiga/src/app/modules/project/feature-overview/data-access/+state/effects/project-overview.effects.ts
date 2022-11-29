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
import { EMPTY, of, zip } from 'rxjs';
import { catchError, exhaustMap, filter, map } from 'rxjs/operators';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { MEMBERS_PAGE_SIZE } from '~/app/modules/project/feature-overview/feature-overview.constants';
import { AppService } from '~/app/services/app.service';
import { RevokeInvitationService } from '~/app/services/revoke-invitation.service';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';
import * as ProjectOverviewActions from '../actions/project-overview.actions';
import {
  selectHasMoreInvitations,
  selectHasMoreMembers,
  selectInvitations,
  selectMembers,
  selectShowAllMembers,
} from '../selectors/project-overview.selectors';

@Injectable()
export class ProjectOverviewEffects {
  public initMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.initMembers),
      concatLatestFrom(() => [
        this.store.select(selectCurrentProject).pipe(filterNil()),
      ]),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.id, 0),
          this.store.select(selectShowAllMembers).pipe(filterNil())
        ).pipe(
          exhaustMap(([membersResponse, showAllMembers]) => {
            return this.projectApiService
              .getInvitations(project.id, 0, MEMBERS_PAGE_SIZE)
              .pipe(
                map((invitationsResponse) => {
                  return ProjectOverviewActions.fetchMembersSuccess({
                    invitations: invitationsResponse.invitations,
                    totalInvitations: invitationsResponse.totalInvitations,
                    members: membersResponse.memberships,
                    totalMemberships: membersResponse.totalMemberships,
                    showAllMembers,
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
            return zip(
              this.projectApiService.getMembers(project.id, members.length),
              this.store.select(selectShowAllMembers).pipe(filterNil())
            ).pipe(
              exhaustMap(([membersResponse, showAllMembers]) => {
                if (membersResponse.memberships.length === MEMBERS_PAGE_SIZE) {
                  return of(
                    ProjectOverviewActions.fetchMembersSuccess({
                      members: membersResponse?.memberships,
                      totalMemberships: membersResponse?.totalMemberships,
                      showAllMembers,
                    })
                  );
                } else {
                  return this.projectApiService
                    .getInvitations(project.id, invitations.length)
                    .pipe(
                      map((invitationsResponse) => {
                        return ProjectOverviewActions.fetchMembersSuccess({
                          invitations: invitationsResponse.invitations,
                          totalInvitations:
                            invitationsResponse.totalInvitations,
                          members: membersResponse.memberships,
                          totalMemberships: membersResponse.totalMemberships,
                          showAllMembers,
                        });
                      })
                    );
                }
              })
            );
          } else if (hasMoreInvitations) {
            return zip(
              this.projectApiService.getInvitations(
                project.id,
                invitations.length
              ),
              this.store.select(selectShowAllMembers).pipe(filterNil())
            ).pipe(
              map(([invitationsResponse, showAllMembers]) => {
                return ProjectOverviewActions.fetchMembersSuccess({
                  invitations: invitationsResponse?.invitations,
                  totalInvitations: invitationsResponse?.totalInvitations,
                  showAllMembers,
                });
              })
            );
          }

          return EMPTY;
        }
      )
    );
  });

  public updateMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateMembersList),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.id, 0),
          this.projectApiService.getInvitations(project.id, 0),
          this.store.select(selectShowAllMembers).pipe(filterNil())
        ).pipe(
          map(([membersResponse, invitationsResponse, showAllMembers]) => {
            if (!showAllMembers) {
              return ProjectOverviewActions.fetchMembersSuccess({
                members: membersResponse.memberships,
                totalMemberships: membersResponse.totalMemberships,
                invitations: invitationsResponse.invitations,
                totalInvitations: invitationsResponse.totalInvitations,
                showAllMembers: showAllMembers,
                updateMembersList: true,
              });
            }
            return ProjectOverviewActions.updateMemberModalList();
          }),
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.errorManagement(httpResponse);
            return EMPTY;
          })
        );
      })
    );
  });

  public updateShowAllMembers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateShowAllMembers),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      exhaustMap(([, project]) => {
        return zip(
          this.projectApiService.getMembers(project.id, 0),
          this.projectApiService.getInvitations(project.id, 0)
        ).pipe(
          map(([membersResponse, invitationsResponse]) => {
            return ProjectOverviewActions.fetchMembersSuccess({
              members: membersResponse.memberships,
              totalMemberships: membersResponse.totalMemberships,
              invitations: invitationsResponse.invitations,
              totalInvitations: invitationsResponse.totalInvitations,
              showAllMembers: false,
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

  public updateProject$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateMembersInfo),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      map(([, project]) => {
        return ProjectActions.fetchProject({ id: project.id });
      })
    );
  });

  public udpateMembersList$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ProjectOverviewActions.updateMembersInfo),
      concatLatestFrom(() =>
        this.store.select(selectCurrentProject).pipe(filterNil())
      ),
      filter(([, project]) => project.userIsAdmin),
      map(() => {
        return ProjectOverviewActions.updateMembersList();
      })
    );
  });

  constructor(
    private store: Store,
    private actions$: Actions,
    private projectApiService: ProjectApiService,
    private appService: AppService,
    private wsService: WsService,
    private revokeInvitationService: RevokeInvitationService
  ) {}
}
