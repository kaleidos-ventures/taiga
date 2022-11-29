/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workspace } from '@taiga/data';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  fetchWorkspace,
  initWorkspaceList,
  resetWorkspace,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import {
  selectCreateFormHasError,
  selectCreatingWorkspace,
  selectLoadingWorkpace,
  selectRejectedInvites,
  selectWorkspaces,
} from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WsService } from '~/app/services/ws';
import { ResizedEvent } from '~/app/shared/resize/resize.model';
import {
  fadeIntOutAnimation,
  slideIn,
  slideInOut,
} from '~/app/shared/utils/animations';

@UntilDestroy()
@Component({
  selector: 'tg-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    slideInOut,
    fadeIntOutAnimation,
    slideIn,
    trigger('skeletonAnimation', [
      state('nothing', style({ blockSize: '0' })),
      state('create', style({ blockSize: '123px' })),
      state('skeleton', style({ blockSize: '188px' })),
      transition('nothing <=> create, skeleton <=> create', animate(200)),
      transition('nothing <=> skeleton', animate(0)),
    ]),
    trigger('slidePanelInOut', [
      transition(':enter', [
        style({ flex: '0 0 0' }),
        animate('200ms ease-in', style({ flex: '0 0 383px' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ flex: '0 0 0' })),
      ]),
    ]),
    trigger('workspaceInOut', [
      transition(':enter', [
        style({
          opacity: '0',
        }),
        animate(
          '300ms ease-out',
          style({
            opacity: '1',
          })
        ),
      ]),
      transition(':leave', [
        style({
          blockSize: '*',
        }),
        animate(
          '300ms ease-out',
          style({
            blockSize: '0',
          })
        ),
      ]),
    ]),
  ],
})
export class WorkspaceComponent implements OnDestroy {
  public eventsSubject: Subject<{
    event: string;
    project: string;
    workspace: string;
  }> = new Subject<{
    event: string;
    project: string;
    workspace: string;
  }>();

  public readonly model$ = this.state.select().pipe(
    map((model) => {
      let skeletonAnimation = 'nothing';

      if (model.workspaceList.length) {
        if (model.creatingWorkspace) {
          skeletonAnimation = 'skeleton';
        } else if (model.showCreate) {
          skeletonAnimation = 'create';
        }
      }

      const workspaceList = model.workspaceList.filter((workspace) => {
        return this.checkWsVisibility(workspace);
      });

      return {
        ...model,
        skeletonAnimation,
        workspaceList,
      };
    })
  );

  public amountOfProjectsToShow = 4;

  constructor(
    private wsService: WsService,
    private store: Store,
    private state: RxState<{
      creatingWorkspace: boolean;
      showCreate: boolean;
      loading: boolean;
      workspaceList: Workspace[];
      showActivity: boolean;
      createFormHasError: boolean;
      rejectedInvites: Project['id'][];
    }>
  ) {
    this.store.dispatch(initWorkspaceList());

    this.state.connect('workspaceList', this.store.select(selectWorkspaces));
    this.state.connect(
      'creatingWorkspace',
      this.store.select(selectCreatingWorkspace)
    );
    this.state.connect('loading', this.store.select(selectLoadingWorkpace));
    this.state.connect(
      'createFormHasError',
      this.store.select(selectCreateFormHasError)
    );

    this.state.connect(
      'rejectedInvites',
      this.store.select(selectRejectedInvites)
    );

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectmemberships.create'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.eventsSubject.next({
          event: 'projectmemberships.create',
          project: eventResponse.event.content.project,
          workspace: eventResponse.event.content.workspace,
        });
      });

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectinvitations.create'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        if (
          this.state.get('workspaceList').some((workspace) => {
            return workspace.id === eventResponse.event.content.workspace;
          })
        ) {
          this.eventsSubject.next({
            event: 'projectinvitations.create',
            project: eventResponse.event.content.project,
            workspace: eventResponse.event.content.workspace,
          });
        } else {
          // If the workspace of the invitation does not exist we fetch the workspace, adding it to the top of the list.
          this.store.dispatch(
            fetchWorkspace({
              workspaceId: eventResponse.event.content.workspace,
            })
          );
        }
      });

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectinvitations.revoke'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.eventsSubject.next({
          event: 'projectinvitations.revoke',
          project: eventResponse.event.content.project,
          workspace: eventResponse.event.content.workspace,
        });
      });
  }

  public toggleActivity(showActivity: boolean) {
    this.state.set({ showActivity });
  }

  public setCreate(showCreate: boolean) {
    this.state.set({ showCreate });
  }

  public trackByWorkspace(index: number, workspace: Workspace) {
    return workspace.id;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = amount >= 6 ? 6 : amount;
  }

  public checkWsVisibility(workspace: Workspace) {
    const role = workspace.userRole;
    const latestProjects = workspace.latestProjects;
    const rejectedInvites = this.state.get('rejectedInvites');
    const hasInvitedProjects = workspace.invitedProjects.filter((project) => {
      return !rejectedInvites.includes(project.id);
    });

    return !(
      role === 'guest' &&
      !latestProjects.length &&
      !hasInvitedProjects.length
    );
  }

  public ngOnDestroy() {
    this.store.dispatch(resetWorkspace());
  }

  public workspaceItemVisibility(workspace: Workspace) {
    if (workspace.latestProjects.length || workspace.invitedProjects.length) {
      return true;
    } else {
      return workspace.userRole !== 'guest';
    }
  }
}
