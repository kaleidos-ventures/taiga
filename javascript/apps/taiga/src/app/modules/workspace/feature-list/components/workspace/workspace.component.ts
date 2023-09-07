/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project, Workspace, User } from '@taiga/data';
import { Subject } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import {
  fetchWorkspace,
  initWorkspaceList,
  resetWorkspace,
  workspaceEventActions,
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
import { WorkspaceItemComponent } from '../workspace-item/workspace-item.component';
import { WorkspaceSkeletonComponent } from '../workspace-skeleton/workspace-skeleton.component';
import { A11yModule } from '@angular/cdk/a11y';
import { WorkspaceCreateComponent } from '../workspace-create/workspace-create.component';

import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '@taiga/ui/tooltip';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { TitleComponent } from '~/app/shared/title/title.component';

@UntilDestroy()
@Component({
  selector: 'tg-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RxState,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'workspace',
    },
  ],
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
          blockSize: '0',
          opacity: '0',
        }),
        animate(
          '300ms ease-out',
          style({
            blockSize: '*',
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
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TitleComponent,
    TuiButtonModule,
    TooltipDirective,
    WorkspaceCreateComponent,
    A11yModule,
    WorkspaceSkeletonComponent,
    TuiLinkModule,
    ResizedDirective,
    WorkspaceItemComponent,
  ],
})
export class WorkspaceComponent implements OnDestroy, OnInit, AfterViewInit {
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
  public animationDisabled = true;

  constructor(
    private wsService: WsService,
    private store: Store,
    private cd: ChangeDetectorRef,
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
  }

  public ngOnInit(): void {
    this.events();
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.animationDisabled = false;
      this.cd.detectChanges();
    }, 1000);
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

  public events() {
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

    this.wsService
      .userEvents<{
        project: string;
        workspace: string;
        name: string;
        deleted_by: User;
      }>('projects.delete')
      .pipe(
        untilDestroyed(this),
        switchMap((eventResponse) => {
          return this.state.select('workspaceList').pipe(
            filter((workspaceList) => !!workspaceList.length),
            take(1),
            map((workspaceList) => {
              return { eventResponse, workspaceList };
            })
          );
        })
      )
      .subscribe(({ eventResponse, workspaceList }) => {
        const workspace = workspaceList.find(
          (it) => it.id === eventResponse.event.content.workspace
        );
        if (workspace?.userRole === 'guest') {
          this.eventsSubject.next({
            event: 'projects.delete',
            project: eventResponse.event.content.project,
            workspace: eventResponse.event.content.workspace,
          });
          this.store.dispatch(
            workspaceEventActions.projectDeleted({
              projectId: eventResponse.event.content.project,
              workspaceId: eventResponse.event.content.workspace,
              name: eventResponse.event.content.name,
            })
          );
        }
      });

    this.wsService
      .userEvents<{
        membership: Membership;
        workspace: string;
      }>('projectmemberships.delete')
      .pipe(
        untilDestroyed(this),
        switchMap((eventResponse) => {
          return this.state.select('workspaceList').pipe(
            filter((workspaceList) => !!workspaceList.length),
            take(1),
            map((workspaceList) => {
              return { eventResponse, workspaceList };
            })
          );
        })
      )
      .subscribe(({ eventResponse, workspaceList }) => {
        const workspace = workspaceList.find(
          (it) => it.id === eventResponse.event.content.workspace
        );
        if (
          workspace?.userRole === 'guest' &&
          eventResponse.event.content.membership.project
        ) {
          this.eventsSubject.next({
            event: 'projects.delete',
            project: eventResponse.event.content.membership.project?.id,
            workspace: eventResponse.event.content.workspace,
          });
          this.store.dispatch(
            workspaceEventActions.projectDeleted({
              projectId: eventResponse.event.content.membership.project?.id,
              workspaceId: eventResponse.event.content.workspace,
              name: eventResponse.event.content.membership.project?.name,
            })
          );
        }
      });
  }
}
