/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { TranslocoService, TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  TuiNotification,
  TuiHostedDropdownModule,
  TuiButtonModule,
  TuiDataListModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, take } from 'rxjs/operators';
import { workspaceActions } from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectProjects,
  selectWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';
import { filterNil } from '~/app/shared/utils/operators';
import { capitalizePipe } from '~/app/shared/pipes/capitalize/capitalize.pipe';
import { DeleteWorkspaceComponent } from '../workspace-delete-modal/workspace-delete-modal.component';
import { WorkspaceDetailEditModalComponent } from '../workspace-detail-edit-modal/workspace-detail-edit-modal.component';
import { TuiDropdownModule } from '@taiga-ui/core/directives/dropdown';
import { WorkspaceDetailSkeletonComponent } from '../workspace-detail-skeleton/workspace-detail-skeleton.component';
import { CommonModule } from '@angular/common';
import { TitleComponent } from '~/app/shared/title/title.component';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { BadgeComponent } from '@taiga/ui/badge/badge.component';
import { TooltipDirective } from '@taiga/ui/tooltip';
interface ViewDetailModel {
  projects: WorkspaceProject[];
  workspace: Workspace | null;
  editingWorkspace: boolean;
}

export interface WorkspaceDetailState {
  workspace: Workspace | null;
  projects: WorkspaceProject[];
  editingWorkspace: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    WorkspaceDetailSkeletonComponent,
    TitleComponent,
    AvatarComponent,
    BadgeComponent,
    TuiHostedDropdownModule,
    TuiDropdownModule,
    TuiButtonModule,
    TooltipDirective,
    RouterLink,
    TuiDataListModule,
    TuiSvgModule,
    RouterOutlet,
    WorkspaceDetailEditModalComponent,
    DeleteWorkspaceComponent,
    capitalizePipe,
  ],
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  public model$!: Observable<ViewDetailModel>;
  public displayWorkspaceOptions = false;
  public showDeleteWorkspaceModal = false;
  public menuItemActive: 'projects' | 'people' = 'projects';

  constructor(
    private wsService: WsService,
    private route: ActivatedRoute,
    private store: Store,
    private state: RxState<WorkspaceDetailState>,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService,
    private appService: AppService,
    private router: Router
  ) {
    this.state.set({
      projects: [],
      editingWorkspace: false,
    });
  }

  public ngOnInit() {
    this.model$ = this.state.select();

    this.route.paramMap
      .pipe(
        untilDestroyed(this),
        map((params) => {
          return params.get('id');
        }),
        filterNil(),
        distinctUntilChanged()
      )
      .subscribe((id) => {
        this.store.dispatch(workspaceActions.fetchWorkspace({ id }));
      });

    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );

    this.state.connect(
      'projects',
      this.store.select(selectProjects).pipe(filterNil())
    );

    this.state.hold(this.state.select('workspace'), (workspace) => {
      if (workspace) {
        const url = window.location.href;

        if (url.includes('/projects')) {
          this.menuItemActive = 'projects';
        } else if (url.includes('/people')) {
          this.menuItemActive = 'people';
        }

        if (!url.includes(workspace.id + '/' + workspace.slug + '/')) {
          void this.router.navigate(
            [
              `workspace/${workspace.id}/${workspace.slug}/${this.menuItemActive}`,
            ],
            { replaceUrl: true }
          );
        }
      }
    });

    this.events();
  }

  public ngOnDestroy() {
    this.state
      .select('workspace')
      .pipe(filterNil(), take(1))
      .subscribe(() => {
        this.wsService
          .command('unsubscribe_from_workspace_events', {
            workspace: this.state.get('workspace')!.id,
          })
          .subscribe();
      });
    this.store.dispatch(workspaceActions.resetWorkspace());
  }

  public events() {
    this.wsService
      .userEvents('workspacememberships.delete')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.userLoseMembership();
      });

    this.state
      .select('workspace')
      .pipe(filterNil(), take(1))
      .subscribe((workspace) => {
        this.wsService
          .events<{
            workspace: string;
            name: string;
            deletedBy: { username: string; fullName: string; color: number };
          }>({
            channel: `workspaces.${workspace.id}`,
            type: 'workspaces.delete',
          })
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.userLoseMembership();
          });
      });
  }

  public userLoseMembership() {
    void this.router.navigate(['/']);
    this.appService.toastNotification({
      message: 'people.remove.no_longer_member',
      paramsMessage: { workspace: this.state.get('workspace')!.name },
      status: TuiNotification.Error,
      scope: 'workspace',
      closeOnNavigation: false,
    });
  }

  public displayWorkspaceOptionsModal() {
    this.displayWorkspaceOptions = true;
  }

  public editWorkspaceModal() {
    this.state.set({ editingWorkspace: true });
  }

  public handleDeleteWorkspace() {
    const workspace = this.state.get('workspace');
    const projects = this.state.get('projects');
    if (projects.length) {
      this.showDeleteWorkspaceModal = true;
    } else {
      this.store.dispatch(
        workspaceActions.deleteWorkspace({
          id: workspace!.id,
          name: workspace!.name,
        })
      );
    }
  }

  public closeEditWorkspaceModal() {
    const announcement = this.translocoService.translate(
      'workspace.edit.changes_canceled'
    );

    this.liveAnnouncer.announce(announcement, 'assertive').then(
      () => {
        this.state.set({ editingWorkspace: false });
      },
      () => {
        // error
      }
    );
  }

  public updateWorkspace(workspaceUpdate: Partial<Workspace>) {
    const currentWorkspace = this.state.get('workspace');
    this.closeEditWorkspaceModal();
    if (currentWorkspace && currentWorkspace?.name !== workspaceUpdate.name) {
      this.store.dispatch(
        workspaceActions.updateWorkspace({
          currentWorkspace,
          nextWorkspace: workspaceUpdate,
        })
      );
    }
  }
}
