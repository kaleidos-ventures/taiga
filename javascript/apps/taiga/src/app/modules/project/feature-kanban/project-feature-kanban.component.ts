/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concatLatestFrom } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiNotification } from '@taiga-ui/core';
import { ShortcutsService } from '@taiga/cdk/services/shortcuts';
import {
  Membership,
  Permissions,
  Project,
  Role,
  Status,
  Story,
  StoryDetail,
  StoryView,
  Workflow,
  WorkflowStatus,
} from '@taiga/data';
import { ModalComponent } from '@taiga/ui/modal/components';
import { combineLatest, filter, map, merge, pairwise, take } from 'rxjs';
import * as ProjectActions from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectMembers,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import { PermissionsService } from '~/app/services/permissions.service';
import { WsService } from '~/app/services/ws';
import { InviteUserModalComponent } from '~/app/shared/invite-user-modal/invite-user-modal.component';
import { PermissionUpdateNotificationService } from '~/app/shared/permission-update-notification/permission-update-notification.service';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { ResizedEvent } from '~/app/shared/resize/resize.model';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { TitleComponent } from '~/app/shared/title/title.component';
import { filterNil } from '~/app/shared/utils/operators';
import { pick } from '~/app/shared/utils/pick';
import { ProjectFeatureStoryWrapperModalViewComponent } from '../feature-story-wrapper-modal-view/project-feature-story-wrapper-modal-view.component';
import { ProjectFeatureStoryWrapperSideViewComponent } from '../feature-story-wrapper-side-view/project-feature-story-wrapper-side-view.component';
import {
  selectStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';
import { KanbanWorkflowComponent } from './components/workflow/kanban-workflow.component';
import {
  KanbanActions,
  KanbanEventsActions,
} from './data-access/+state/actions/kanban.actions';
import {
  KanbanState,
  kanbanFeature,
} from './data-access/+state/reducers/kanban.reducer';
import {
  selectLoadingWorkflow,
  selectStories,
  selectWorkflow,
} from './data-access/+state/selectors/kanban.selectors';
import { KanbanReorderEvent, KanbanStory } from './kanban.model';
import { KanbanHeaderComponent } from './components/kanban-header/kanban-header.component';
import { MovedWorkflowService } from './services/moved-workflow.service';

interface ComponentState {
  loadingWorkflow: KanbanState['loadingWorkflow'];
  workflow: KanbanState['workflow'];
  workflows: Workflow[];
  invitePeopleModal: boolean;
  showStoryDetail: boolean;
  storyView: StoryView;
  project: Project;
  selectedStory: StoryDetail;
  members: Membership[];
  columns: ReturnType<typeof kanbanFeature.selectColums>;
  stories: KanbanStory[];
}

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-kanban',
  templateUrl: './project-feature-kanban.component.html',
  styleUrls: ['./project-feature-kanban.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TitleComponent,
    ResizedDirective,
    KanbanWorkflowComponent,
    ProjectFeatureStoryWrapperSideViewComponent,
    ModalComponent,
    ProjectFeatureStoryWrapperModalViewComponent,
    InviteUserModalComponent,
    KanbanHeaderComponent,
  ],
})
export class ProjectFeatureKanbanComponent {
  @ViewChild(ProjectFeatureStoryWrapperModalViewComponent)
  public projectFeatureStoryWrapperModalViewComponent?: ProjectFeatureStoryWrapperModalViewComponent;

  @ViewChild(ProjectFeatureStoryWrapperSideViewComponent)
  public projectFeatureStoryWrapperSideViewComponent?: ProjectFeatureStoryWrapperSideViewComponent;

  @Input()
  public set workflowSlug(workflow: Workflow['slug']) {
    if (!this.initalRender || workflow !== this.state.get('workflow')?.slug) {
      this.store.dispatch(KanbanActions.loadWorkflowKanban({ workflow }));
      this.initalRender = true;
    }
  }

  public initalRender = false;
  public invitePeopleModal = false;
  public kanbanWidth = 0;
  public model$ = this.state.select();
  public project$ = this.store.select(selectCurrentProject);

  public lockKanban = false;

  constructor(
    private store: Store,
    private state: RxState<ComponentState>,
    private wsService: WsService,
    private permissionService: PermissionsService,
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    private location: Location,
    private movedWorkflow: MovedWorkflowService,
    public shortcutsService: ShortcutsService,
    public routeHistoryService: RouteHistoryService,
    public permissionUpdateNotificationService: PermissionUpdateNotificationService
  ) {
    const canViewPage = this.permissionService.hasPermissions('story', [
      'view',
    ]);

    if (!canViewPage) {
      void this.router.navigate(['403']);
      return;
    }

    this.checkInviteModalStatus();
    this.state.connect(
      'loadingWorkflow',
      this.store.select(selectLoadingWorkflow)
    );

    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'members',
      this.store.select(selectMembers).pipe(filterNil())
    );
    this.state.connect(
      'showStoryDetail',
      this.route.data.pipe(map((data) => !!data.stories))
    );

    this.state.connect(
      'selectedStory',
      this.store.select(selectStory).pipe(filterNil())
    );

    this.state.connect(
      'workflows',
      this.store
        .select(selectCurrentProject)
        .pipe(filterNil())
        .pipe(
          map((project) => {
            return project.workflows;
          })
        )
    );

    this.state.hold(
      combineLatest([
        this.state.select('storyView'),
        this.state.select('showStoryDetail'),
      ]),
      ([storyView, showStoryDetail]) => {
        if (showStoryDetail && storyView === 'side-view') {
          this.setCloseShortcut();
          this.shortcutsService.setScope('side-view');
        } else {
          this.shortcutsService.deleteScope('side-view');
        }
      }
    );
    this.state.connect('storyView', this.store.select(selectStoryView));
    this.state.connect('workflow', this.store.select(selectWorkflow));
    this.state.connect(
      'columns',
      this.store.select(kanbanFeature.selectColums)
    );
    this.events();

    this.permissionService
      .hasPermissions$('story', ['view'])
      .pipe(
        untilDestroyed(this),
        filter((canView) => !canView),
        concatLatestFrom(() => this.project$.pipe(filterNil()))
      )
      .subscribe(([, project]) => {
        void this.router.navigate([
          'project',
          project.id,
          project.slug,
          'overview',
        ]);

        this.appService.toastNotification({
          message: 'lost_kanban_access',
          status: TuiNotification.Error,
          scope: 'kanban',
        });
      });

    this.movedWorkflow.postponed$
      .pipe(untilDestroyed(this))
      .subscribe((postponed) => {
        this.lockKanban = !!postponed;
      });

    this.state.connect(
      'stories',
      this.store
        .select(selectStories)
        .pipe(map((stories) => Object.values(stories).flat()))
    );
  }

  public setCloseShortcut() {
    this.shortcutsService
      .task('cancel', {}, 'side-view')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeSideview();
      });
  }

  public closeSideview() {
    this.projectFeatureStoryWrapperSideViewComponent?.storyDetailComponent?.closeStory();
    this.shortcutsService.deleteScope('side-view');
  }

  public closeModal() {
    this.state.set({ invitePeopleModal: false });
  }

  public closeViewModal() {
    this.projectFeatureStoryWrapperModalViewComponent?.storyDetailComponent?.closeStory();
  }

  public trackBySlug(_index: number, obj: { slug: string }) {
    return obj.slug;
  }

  public onResized(event: ResizedEvent) {
    this.kanbanWidth = event.newRect.width;
  }

  private events() {
    this.wsService
      .projectEvents<{ story: Story }>('stories.create')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        this.store.dispatch(
          KanbanEventsActions.newStory({ story: msg.event.content.story })
        );
      });

    this.wsService
      .projectEvents<KanbanReorderEvent>('stories.reorder')
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        this.store.dispatch(
          KanbanEventsActions.reorderStory(event.event.content.reorder)
        );
      });

    this.wsService
      .projectEvents<{ ref: Story['ref'] }>('stories.delete')
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        this.store.dispatch(
          KanbanEventsActions.deleteStory({ ref: msg.event.content.ref })
        );
      });

    this.wsService
      .projectEvents<{ membership: Membership; workspace: string }>(
        'projectmemberships.delete'
      )
      .pipe(takeUntilDestroyed())
      .subscribe((eventResponse) => {
        this.store.dispatch(
          ProjectActions.projectEventActions.removeMember(
            eventResponse.event.content
          )
        );
      });

    this.wsService
      .projectEvents<{ workflowStatus: WorkflowStatus }>(
        'workflowstatuses.create'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        const workflowStatusResponse =
          eventResponse.event.content.workflowStatus;
        const status = {
          ...pick(workflowStatusResponse, ['id', 'name', 'color', 'order']),
        };
        this.store.dispatch(
          KanbanEventsActions.updateStatus({
            status,
            workflow: workflowStatusResponse.workflow.slug,
          })
        );
      });

    this.wsService
      .projectEvents<{ workflowStatus: WorkflowStatus }>(
        'workflowstatuses.update'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        const workflowStatusResponse =
          eventResponse.event.content.workflowStatus;
        const status = {
          ...pick(workflowStatusResponse, ['id', 'name', 'color', 'order']),
        };
        this.store.dispatch(
          KanbanEventsActions.editStatus({
            status,
            workflow: workflowStatusResponse.workflow.slug,
          })
        );
      });

    this.wsService
      .projectEvents<{
        workflowStatus: Status & { workflow: Workflow };
        moveToSlug: Status['id'];
      }>('workflowstatuses.delete')
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        const content = eventResponse.event.content;
        this.store.dispatch(
          KanbanEventsActions.statusDeleted({
            status: content.workflowStatus.id,
            workflow: content.workflowStatus.workflow.slug,
            moveToStatus: content.moveToSlug,
          })
        );
      });

    merge(
      this.wsService
        .projectEvents<Role>('projectroles.update')
        .pipe(map((data) => data.event.content)),
      this.wsService
        .userEvents<{ membership: Membership }>('projectmemberships.update')
        .pipe(map((data) => data.event.content.membership.role))
    )
      .pipe(untilDestroyed(this))
      .subscribe((permissions) => {
        this.project$
          .pipe(filterNil(), pairwise(), take(1))
          .subscribe(([prev, next]) => {
            this.permissionUpdateNotificationService.notifyLosePermissions(
              prev,
              next
            );
          });
        this.store.dispatch(ProjectActions.fetchProjectMembers());
        this.unassignRoleMembersWithoutPermissions(permissions as Role);
      });
  }

  private unassignRoleMembersWithoutPermissions(role: Role) {
    if (!role.permissions.includes(Permissions.viewStory)) {
      const members = this.state.get('members');

      const membersWithoutViewPermissions = members.filter((member) => {
        return member.role.name === role.name;
      });

      this.store.dispatch(
        KanbanActions.removeMembers({
          members: membersWithoutViewPermissions,
        })
      );
    }
  }

  private checkInviteModalStatus() {
    const state = window.history.state as { invite: boolean } | undefined;
    this.state.set({ invitePeopleModal: !!state?.invite });

    if (state?.invite) {
      this.location.replaceState(this.router.url, '', {
        ...window.history.state,
        invite: false,
      });
    }
  }
}
