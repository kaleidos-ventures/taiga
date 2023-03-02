/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  AnimationEvent,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, User, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { map, pairwise, take } from 'rxjs/operators';
import {
  deleteWorkspace,
  deleteWorkspaceProject,
  fetchWorkspace,
  invitationDetailCreateEvent,
  invitationDetailRevokedEvent,
  resetWorkspace,
  updateWorkspace,
  workspaceDetailEventActions,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import {
  selectCreatingWorkspaceDetail,
  selectLoading,
  selectProjects,
  selectWorkspace,
  selectWorkspaceInvitedProjects,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { acceptInvitationEvent } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { WsService } from '~/app/services/ws';
import { acceptInvitationId } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { selectAcceptedInvite } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';
import { ResizedEvent } from '~/app/shared/resize/resize.model';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
interface ViewDetailModel {
  projects: WorkspaceProject[];
  workspace: Workspace | null;
  creatingWorkspaceDetail: boolean;
  projectSiblingToAnimate: string[];
  slideOutActive: boolean;
  allVisibleProjects: WorkspaceProject[];

  invitations: WorkspaceProject[];
  newInvitations: string[];
  editingWorkspace: boolean;
}

export interface WorkspaceDetailState {
  workspace: Workspace | null;
  projects: WorkspaceProject[];
  creatingWorkspaceDetail: boolean;
  skeletonAnimation: string;
  projectSiblingToAnimate: string[];
  slideOutActive: boolean;

  invitations: WorkspaceProject[];
  newInvitations: string[];
  rejectedInvites: string[];
  acceptedInvites: string[];
  editingWorkspace: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardSlideOut', [
      transition('on => void', [
        style({ zIndex: 1 }),
        animate(
          '0.3s linear',
          style({
            transform: 'translateX(-100%)',
            opacity: 0,
          })
        ),
      ]),
    ]),
    trigger('newProject', [
      transition('* => inprogress', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(
          '0.3s linear',
          style({
            transform: 'translateX(0)',
            opacity: 1,
          })
        ),
      ]),
    ]),
    trigger('newInvitationSibling', [
      transition('* => inprogress', [
        style({ transform: 'translateX(-100%)' }),
        animate(
          '0.3s linear',
          style({
            transform: 'translateX(0)',
          })
        ),
      ]),
    ]),
    trigger('reorder', [
      transition('* => moving', [
        animate(
          '0.3s linear',
          style({
            transform: 'translateX(-100%)',
          })
        ),
      ]),
      transition('* => entering', [
        style({ display: 'none' }),
        animate('0.3s'),
      ]),
    ]),
  ],
  providers: [RxState],
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  public loading$ = this.store.select(selectLoading);
  public model$!: Observable<ViewDetailModel>;

  public amountOfProjectsToShow = 10;

  public animationDisabled = true;

  public newProjectsToAnimate: string[] = [];

  public reorder: Record<string, string> = {};

  public displayWorkspaceOptions = false;

  public showDeleteWorkspaceModal = false;
  public deleteProjectModal = false;
  public projectToDelete!: Project;

  public get gridClass() {
    return `grid-items-${this.amountOfProjectsToShow}`;
  }

  constructor(
    private wsService: WsService,
    private route: ActivatedRoute,
    private store: Store,
    private userStorageService: UserStorageService,
    private state: RxState<WorkspaceDetailState>,
    private location: Location,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService
  ) {
    this.state.set({
      rejectedInvites: [],
      projectSiblingToAnimate: [],
      invitations: [],
      editingWorkspace: false,
    });
  }

  public workspaceEventSubscription() {
    const workspace = this.state.get('workspace');
    if (workspace) {
      this.wsService
        .command('subscribe_to_workspace_events', {
          workspace: workspace.id,
        })
        .subscribe();

      this.wsService
        .events<{
          project: string;
          workspace: string;
          name: string;
          deleted_by: User;
        }>({
          channel: `workspaces.${workspace.id}`,
          type: 'projects.delete',
        })
        .pipe(untilDestroyed(this))
        .subscribe((eventResponse) => {
          this.store.dispatch(
            workspaceDetailEventActions.projectDeleted({
              projectId: eventResponse.event.content.project,
              workspaceId: eventResponse.event.content.workspace,
              name: eventResponse.event.content.name,
            })
          );
        });

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
        .subscribe((eventResponse) => {
          this.store.dispatch(
            workspaceDetailEventActions.workspaceDeleted({
              name: eventResponse.event.content.name,
            })
          );
        });
    }
  }

  public ngOnInit(): void {
    const rejectedInvites = this.getRejectedInvites();

    this.state.set({
      rejectedInvites,
      projectSiblingToAnimate: [],
    });

    this.model$ = this.state.select().pipe(
      map((state) => {
        let invitations = state.invitations;
        let projects = state.projects;

        // ignore previously accepted invitations
        projects = projects.filter(
          (project) => !state.acceptedInvites.includes(project.id)
        );

        // workspace admin may have an invitation to a project that it already has access to.
        if (state.workspace?.userRole === 'admin') {
          invitations = [];
        } else {
          if (state.workspace?.userRole === 'member') {
            // a member can have some projects in both list because the project could have access permissions for workspace members
            invitations = invitations.filter((invitation) => {
              return !projects.find((project) => {
                return project.id === invitation.id;
              });
            });
          } else {
            projects = projects.filter((project) => {
              return !invitations.find((invitation) => {
                return project.id === invitation.id;
              });
            });
          }
          invitations = invitations.filter((invitation) => {
            return !state.rejectedInvites.includes(invitation.id);
          });
        }

        const allVisibleProjects = [...invitations, ...projects];

        if (!state.creatingWorkspaceDetail) {
          requestAnimationFrame(() => {
            this.animationDisabled = false;
          });
        }
        return {
          ...state,
          projects,
          invitations,
          allVisibleProjects,
        };
      })
    );

    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.store.dispatch(fetchWorkspace({ id }));
      }
    });

    this.state.connect(
      'acceptedInvites',
      this.store.select(selectAcceptedInvite)
    );
    this.state.connect(
      'creatingWorkspaceDetail',
      this.store.select(selectCreatingWorkspaceDetail)
    );
    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
    this.state.connect(
      'projects',
      this.store.select(selectProjects).pipe(filterNil())
    );

    this.state.hold(
      this.store.select(selectWorkspaceInvitedProjects).pipe(pairwise()),
      ([old, newInvites]) => {
        this.refreshInvitations(old, newInvites);
      }
    );

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectmemberships.create'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.membershipCreateEvent(eventResponse.event.content.project);
      });

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectinvitations.create'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.state.set({ slideOutActive: false });
        this.invitationCreateEvent(eventResponse.event.content.project);
      });

    this.wsService
      .userEvents<{ project: string; workspace: string }>(
        'projectinvitations.revoke'
      )
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.invitationRevokedEvent(eventResponse.event.content.project);
      });

    this.state.hold(this.state.select('workspace'), (workspace) => {
      workspace &&
        this.location.go(`workspace/${workspace.id}/${workspace.slug}`);
    });
    this.state
      .select('workspace')
      .pipe(filterNil(), take(1))
      .subscribe(() => {
        this.workspaceEventSubscription();
      });
  }

  public invitationRevokedEvent(projectId: string) {
    this.store.dispatch(
      invitationDetailRevokedEvent({
        projectId,
      })
    );
  }

  public invitationCreateEvent(projectId: string) {
    const workspace = this.state.get('workspace');
    if (workspace) {
      if (workspace.userRole === 'admin') {
        this.newProjectsToAnimate.push(projectId);
      }
      this.store.dispatch(
        invitationDetailCreateEvent({
          projectId: projectId,
          workspaceId: workspace.id,
          role: workspace.userRole,
        })
      );
    }
  }

  public membershipCreateEvent(projectId: string) {
    this.store.dispatch(
      acceptInvitationEvent({
        projectId,
      })
    );
  }

  public getRejectedInvites(): Project['id'][] {
    return (
      this.userStorageService.get<Project['id'][] | undefined>(
        'workspace_rejected_invites'
      ) ?? []
    );
  }

  public setRejectedInvites(rejectedInvites: string[]) {
    this.userStorageService.set('workspace_rejected_invites', rejectedInvites);
    this.state.set({ rejectedInvites });
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.id;
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = amount >= 10 ? 10 : amount;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

  public acceptProjectInvite(id: string, name?: string) {
    this.store.dispatch(
      acceptInvitationId({
        id,
        name,
      })
    );
  }

  public rejectProjectInvite(id: Project['id']) {
    this.state.set({ slideOutActive: true });

    requestAnimationFrame(() => {
      this.animateLeavingInvitationSiblings(id);
      const rejectedInvites = this.getRejectedInvites();
      rejectedInvites.push(id);
      this.setRejectedInvites(rejectedInvites);
    });
  }

  public getSiblingsRow(id: string) {
    const projectsToShow = this.amountOfProjectsToShow;
    let vm!: ViewDetailModel;

    this.model$.pipe(take(1)).subscribe((model) => {
      vm = model;
    });

    const result = [...vm.invitations, ...vm.projects].reduce(
      (result, item, index) => {
        const chunkIndex = Math.floor(index / projectsToShow);

        if (!result[chunkIndex]) {
          result[chunkIndex] = [];
        }

        result[chunkIndex].push(item);

        return result;
      },
      [] as Array<WorkspaceProject[]>
    );
    return result.find((chunk) => {
      return chunk.find((project) => project.id === id);
    });
  }

  public animateLeavingInvitationSiblings(id: string) {
    const siblings = this.getSiblingsRow(id);
    if (siblings) {
      const rejectedIndex = siblings.findIndex((project) => project.id === id);
      siblings.forEach((project, index) => {
        if (index > rejectedIndex) {
          this.reorder[project.id] = 'moving';
        }
      });
      let vm!: ViewDetailModel;

      this.model$.pipe(take(1)).subscribe((model) => {
        vm = model;
      });

      const projectsToShow = this.amountOfProjectsToShow;
      const newProjectInTopLine = vm.allVisibleProjects[projectsToShow];

      if (newProjectInTopLine) {
        this.reorder[newProjectInTopLine.id] = 'entering';
      }
    }
  }

  public reorderDone(event: AnimationEvent) {
    if (event.fromState === null && event.toState === 'moving') {
      this.reorder = {};
    }
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
    this.store.dispatch(resetWorkspace());
  }

  public trackByIndex(index: number) {
    return index;
  }

  public newProjectAnimationDone(event: AnimationEvent) {
    if (event.fromState !== 'void') {
      return;
    }

    this.state.set({
      projectSiblingToAnimate: [],
    });
  }

  public slideOutAnimationDone(event: AnimationEvent) {
    if (event.toState !== 'void') {
      return;
    }

    this.state.set({ slideOutActive: false });
  }

  public newProjectAnimationStart(
    event: AnimationEvent,
    project: WorkspaceProject
  ) {
    if (event.fromState !== 'void' || this.state.get('slideOutActive')) {
      return;
    }

    const siblings = this.getSiblingsRow(project.id);

    if (siblings) {
      this.state.set({
        projectSiblingToAnimate: siblings
          .filter((it) => it.id !== project.id)
          .map((it) => it.id),
      });
    }
  }

  public refreshInvitations(
    old: WorkspaceProject[],
    invitations: WorkspaceProject[]
  ) {
    let removedInvitations: string[] = [];
    let newInvitations: string[] = [];
    let addedInvitations: WorkspaceProject[] = [];
    if (invitations) {
      addedInvitations = invitations;
    }
    const oldInvitations = old;

    if (oldInvitations) {
      newInvitations = addedInvitations
        .filter((invitation) => {
          return !oldInvitations.find((oldInvitation) => {
            return oldInvitation.id === invitation.id;
          });
        })
        .map((invitation) => invitation.id);

      removedInvitations = oldInvitations
        .filter((invitation) => {
          return !addedInvitations.find((oldInvitation) => {
            return oldInvitation.id === invitation.id;
          });
        })
        .map((invitation) => invitation.id);
    }

    if (removedInvitations.length) {
      // activate slideOut & then re-render template (requestAnimationFrame) to start the :leave animation
      this.state.set({ slideOutActive: true });

      requestAnimationFrame(() => {
        if (removedInvitations.length) {
          this.animateLeavingInvitationSiblings(removedInvitations[0]);
        }

        this.state.set({
          newInvitations,
          invitations: addedInvitations,
        });
      });
    } else {
      this.state.set({ slideOutActive: true });
      this.state.set({
        newInvitations,
        invitations: addedInvitations,
      });
    }
  }

  public displayWorkspaceOptionsModal() {
    this.displayWorkspaceOptions = true;
  }

  public editWorkspaceModal() {
    this.state.set({ editingWorkspace: true });
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
        updateWorkspace({ currentWorkspace, nextWorkspace: workspaceUpdate })
      );
    }
  }

  public handleDeleteWorkspace() {
    const workspace = this.state.get('workspace');
    if (workspace?.hasProjects) {
      this.showDeleteWorkspaceModal = true;
    } else {
      this.store.dispatch(
        deleteWorkspace({
          id: workspace!.id,
          name: workspace!.name,
        })
      );
    }
  }

  public setProjectToDelete(
    projectToDelete: Pick<
      Project,
      'id' | 'name' | 'slug' | 'description' | 'color' | 'logoSmall'
    >
  ) {
    this.projectToDelete = projectToDelete as Project;
  }

  public openModal(modalName: string) {
    if (modalName === 'deleteModal') {
      this.deleteProjectModal = true;
    }
  }

  public submitDeleteProject() {
    const workspace = this.state.get('workspace');
    if (workspace) {
      this.deleteProjectModal = false;
      this.store.dispatch(
        deleteWorkspaceProject({
          projectName: this.projectToDelete.name,
          projectId: this.projectToDelete.id,
        })
      );
    }
  }
}
