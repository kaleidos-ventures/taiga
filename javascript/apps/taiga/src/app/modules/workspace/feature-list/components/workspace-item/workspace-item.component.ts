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
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { randUserName } from '@ngneat/falso';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  Membership,
  Project,
  User,
  Workspace,
  WorkspaceProject,
} from '@taiga/data';
import { Observable, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  acceptInvitationEvent,
  fetchWorkspaceInvitationsSuccess,
  fetchWorkspaceProjects,
  invitationCreateEvent,
  invitationRevokedEvent,
  setWorkspaceListRejectedInvites,
  workspaceEventActions,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import {
  selectLoadingWorkspaces,
  selectRejectedInvites,
  selectWorkspaceProject,
} from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { WsService } from '~/app/services/ws';
import { invitationProjectActions } from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import { selectProjectAcceptedInvite } from '~/app/shared/invite-user-modal/data-access/+state/selectors/invitation.selectors';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';

interface ViewModel {
  projectsToShow: number;
  showAllProjects: boolean;
  projects: WorkspaceProject[];
  invitations: WorkspaceProject[];
  showMoreProjects: boolean;
  showLessProjects: boolean;
  remainingProjects: number;
  slideOutActive: boolean;
  skeletonToShow: number;
  acceptedInvites: string[];
  loadingWorkspaces: string[];
  workspacesSkeletonList: string[];
  projectSiblingToAnimate: string[];
  newInvitations: string[];
  newProjects: string[];
  allVisibleProjects: WorkspaceProject[];
}

export interface WorkspaceItemState {
  projectsToShow: number;
  showAllProjects: boolean;
  projects: WorkspaceProject[];
  invitations: WorkspaceProject[];
  workspaceProjects: WorkspaceProject[];
  rejectedInvites: string[];
  slideOutActive: boolean;
  acceptedInvites: string[];
  skeletonToShow: number;
  loadingWorkspaces: string[];
  workspacesSkeletonList: [];
  projectSiblingToAnimate: string[];
  newInvitations: string[];
  newProjects: string[];
}

@UntilDestroy()
@Component({
  selector: 'tg-workspace-item',
  templateUrl: './workspace-item.component.html',
  styleUrls: ['./workspace-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
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
})
export class WorkspaceItemComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input()
  public workspace!: Workspace;

  @Input() public wsEvents!: Observable<{
    event: string;
    project: string;
    workspace: string;
  }>;

  @Input()
  public set projectsToShow(projectsToShow: number) {
    this.state.set({
      projectsToShow: projectsToShow <= 3 ? 3 : projectsToShow,
    });
  }

  public newProjectsToAnimate: string[] = [];

  public model$!: Observable<ViewModel>;

  public reorder: Record<string, string> = {};

  public animationDisabled = true;

  private eventsSubscription$!: Subscription;

  constructor(
    private store: Store,
    private state: RxState<WorkspaceItemState>,
    private userStorageService: UserStorageService,
    private cd: ChangeDetectorRef,
    private wsService: WsService
  ) {
    this.state.set({
      rejectedInvites: [],
      invitations: [],
      projectSiblingToAnimate: [],
      slideOutActive: false,
      loadingWorkspaces: [],
      acceptedInvites: [],
      workspaceProjects: []
    });
  }

  public get gridClass() {
    return `grid-items-${this.state.get('projectsToShow')}`;
  }

  public setRejectedInvites(rejectedInvites: string[]) {
    this.userStorageService.set('general_rejected_invites', rejectedInvites);
    this.store.dispatch(
      setWorkspaceListRejectedInvites({ projects: rejectedInvites })
    );
  }

  public ngOnInit() {
    this.state.connect(
      'rejectedInvites',
      this.store.select(selectRejectedInvites)
    );

    this.state.connect(
      'acceptedInvites',
      this.store.select(selectProjectAcceptedInvite)
    );
    this.state.connect(
      'workspaceProjects',
      this.store.select(selectWorkspaceProject(this.workspace.id))
    );

    this.state.connect(
      'loadingWorkspaces',
      this.store.select(selectLoadingWorkspaces)
    );

    this.eventsSubscription$ = this.wsEvents.subscribe((eventResponse) => {
      this.wsEvent(
        eventResponse.event,
        eventResponse.project,
        eventResponse.workspace
      );
    });

    this.model$ = this.state.select().pipe(
      map((state) => {
        if (state.loadingWorkspaces.includes(this.workspace.id)) {
          this.animationDisabled = true;
        }
        let invitations = state.invitations;
        let projects = state.workspaceProjects;
        // ignore previously accepted invitations
        projects = projects.filter(
          (project) => !state.acceptedInvites.includes(project.id)
        );

        // workspace admin/member may have an invitation to a project that it already has access to.
        if (this.workspace.userRole === 'admin') {
          invitations = [];
        } else {
          if (this.workspace.userRole === 'member') {
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

        const totalInvitations = invitations.length;
        const allVisibleProjects = [...invitations, ...projects];

        if (!state.showAllProjects) {
          invitations = invitations.slice(0, state.projectsToShow);
          projects = projects.slice(
            0,
            state.projectsToShow - invitations.length
          );
        }

        const showMoreProjects =
          !state.showAllProjects &&
          this.workspace.totalProjects + totalInvitations >
            state.projectsToShow;

        const showLessProjects =
          state.showAllProjects &&
          this.workspace.totalProjects + totalInvitations >
            state.projectsToShow;

        const remainingProjects =
          this.workspace.totalProjects +
          totalInvitations -
          state.projectsToShow;

        const totalCards = invitations.length + projects.length;
        let skeletonToShow =
          state.projectsToShow - (totalCards % state.projectsToShow);
        if (totalCards > 0) {
          skeletonToShow === 0
            ? (skeletonToShow = state.projectsToShow)
            : skeletonToShow;
        } else {
          skeletonToShow = 0;
        }

        state.slideOutActive = false;

        const workspacesSkeletonList = state.loadingWorkspaces;

        if (!state.loadingWorkspaces.includes(this.workspace.id)) {
          requestAnimationFrame(() => {
            this.animationDisabled = false;
          });
        }

        return {
          ...state,
          projects,
          invitations,
          showMoreProjects,
          showLessProjects,
          remainingProjects,
          skeletonToShow,
          workspacesSkeletonList,
          allVisibleProjects,
          acceptedInvites: state.acceptedInvites,
        };
      })
    );
  }

  public ngAfterViewInit() {
    this.state.set({ slideOutActive: false });
    if (this.workspace.userRole !== 'guest') {
      this.wsService
        .command('subscribe_to_workspace_events', {
          workspace: this.workspace.id,
        })
        .subscribe();
    }
    this.wsService
      .events<{
        project: string;
        workspace: string;
        name: string;
        deleted_by: User;
      }>({
        channel: `workspaces.${this.workspace.id}`,
        type: 'projects.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.store.dispatch(
          workspaceEventActions.projectDeleted({
            projectId: eventResponse.event.content.project,
            workspaceId: eventResponse.event.content.workspace,
            name: eventResponse.event.content.name,
          })
        );
      });

    this.wsService
      .events<{
        membership: Membership;
        workspace: string;
      }>({
        channel: `workspaces.${this.workspace.id}`,
        type: 'projectmemberships.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        if (eventResponse.event.content.membership.project) {
          this.store.dispatch(
            workspaceEventActions.projectMembershipLost({
              projectId: eventResponse.event.content.membership.project?.id,
              workspaceId: eventResponse.event.content.workspace,
              name: eventResponse.event.content.membership.project?.name,
            })
          );
        }
      });

    this.wsService
      .events<{
        workspace: string;
        name: string;
        deletedBy: { username: string; fullName: string; color: number };
      }>({
        channel: `workspaces.${this.workspace.id}`,
        type: 'workspaces.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        this.store.dispatch(
          workspaceEventActions.workspaceDeleted({
            workspaceId: eventResponse.event.content.workspace,
          })
        );
      });

    this.wsService
      .events<{
        member: Membership;
      }>({
        channel: `workspaces.${this.workspace.id}`,
        type: 'workspacememberships.delete',
      })
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          workspaceEventActions.workspaceMembershipLost({
            workspaceId: this.workspace.id,
          })
        );
      });
  }

  public ngOnDestroy(): void {
    this.wsService
      .command('unsubscribe_from_workspace_events', {
        workspace: this.workspace.id,
      })
      .subscribe();
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

  public newProjectAnimationDone(event: AnimationEvent) {
    if (event.fromState !== 'void') {
      return;
    }

    this.state.set({
      projectSiblingToAnimate: [],
    });
  }

  public wsEvent(event: string, projectId: string, workspaceId: string) {
    if (this.workspace.id === workspaceId) {
      if (event === 'projectinvitations.create') {
        this.invitationCreateEvent(projectId, workspaceId);
      } else if (event === 'projectmemberships.create') {
        this.membershipCreateEvent(projectId);
      } else if (event === 'projectinvitations.revoke') {
        this.invitationRevokedEvent(projectId);
      }
    }
    this.cd.detectChanges();
  }

  public invitationRevokedEvent(project: string) {
    const invitations = [...this.state.get('invitations')];
    const workspaceInvitations = invitations.filter(
      (workspaceInvitation) => workspaceInvitation.id !== project
    );
    const newWorkspace = { ...this.workspace };
    newWorkspace.invitedProjects = workspaceInvitations;
    this.store.dispatch(
      invitationRevokedEvent({
        workspace: newWorkspace,
      })
    );
  }

  public invitationCreateEvent(
    projectId: string,
    workspaceId: string,
    fake?: boolean
  ) {
    if (fake) {
      const projectName = randUserName();
      const fakeInvitation: WorkspaceProject = {
        id: '123',
        logoSmall: '',
        name: projectName,
        slug: projectName,
        description: 'asd',
        color: 1,
      };

      const invitations = [...this.state.get('invitations')];
      invitations.unshift(fakeInvitation);
      if (this.workspace.userRole === 'admin') {
        this.newProjectsToAnimate.push(projectName);
      }
      this.store.dispatch(
        fetchWorkspaceInvitationsSuccess({
          projectId: projectName,
          workspaceId,
          project: [fakeInvitation as Project],
          invitations: [fakeInvitation as Project],
          role: this.workspace.userRole,
          rejectedInvites: this.state.get('rejectedInvites'),
        })
      );
    } else {
      if (this.workspace.userRole === 'admin') {
        this.newProjectsToAnimate.push(projectId);
      }
      this.store.dispatch(
        invitationCreateEvent({
          projectId,
          workspaceId,
          role: this.workspace.userRole,
          rejectedInvites: this.state.get('rejectedInvites'),
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

  public getSiblingsRow(id: string) {
    const projectsToShow = this.state.get('projectsToShow');
    let vm!: ViewModel;

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

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.id;
  }

  public acceptProjectInvite(id: Project['id'], name: Project['name']) {
    this.store.dispatch(
      invitationProjectActions.acceptInvitationId({
        id,
        name,
      })
    );
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

      let vm!: ViewModel;

      this.model$.pipe(take(1)).subscribe((model) => {
        vm = model;
      });

      const projectsToShow = this.state.get('projectsToShow');
      const newProjectInTopLine = vm.allVisibleProjects[projectsToShow];

      if (newProjectInTopLine) {
        this.reorder[newProjectInTopLine.id] = 'entering';
      }
    }
  }

  public rejectProjectInvite(id: Project['id']) {
    this.state.set({ slideOutActive: true });

    requestAnimationFrame(() => {
      this.animateLeavingInvitationSiblings(id);
      const rejectedInvites = [...this.state.get('rejectedInvites')];
      rejectedInvites.push(id);
      this.setRejectedInvites(rejectedInvites);
    });
  }

  public reorderDone(event: AnimationEvent) {
    if (event.fromState === null && event.toState === 'moving') {
      this.reorder = {};
    }
  }

  public slideOutAnimationDone(event: AnimationEvent) {
    if (event.toState !== 'void') {
      return;
    }
    this.state.set({ slideOutActive: false });
  }

  public setShowAllProjects(showAllProjects: boolean) {
    this.state.set({ showAllProjects });
    if (showAllProjects === true) {
      this.store.dispatch(fetchWorkspaceProjects({ id: this.workspace.id }));
    }
  }

  public getActiveInvitations() {
    const invitations = this.state.get('invitations');
    const rejectedInvites = this.state.get('rejectedInvites');

    return invitations.filter((invitation) => {
      return !rejectedInvites.includes(invitation.id);
    });
  }

  public userHasNoAccess() {
    const hasProjects = this.workspace.hasProjects;
    const latestProjects = this.workspace.latestProjects.length;
    const isSlideOutAnimationActive = this.state.get('slideOutActive');
    const isAdmin = this.workspace.userRole === 'admin';
    const hasActiveInvitations = this.getActiveInvitations().length;

    return (
      hasProjects &&
      !isSlideOutAnimationActive &&
      !latestProjects &&
      !hasActiveInvitations &&
      !isAdmin
    );
  }

  public userHasNoProjects() {
    const hasProjects = this.workspace.hasProjects;
    const latestProjects = this.workspace.latestProjects.length;
    const isSlideOutAnimationActive = this.state.get('slideOutActive');
    const hasActiveInvitations = this.getActiveInvitations().length;
    const isAdmin = this.workspace.userRole === 'admin';

    return (
      !hasProjects &&
      !isSlideOutAnimationActive &&
      !latestProjects &&
      !hasActiveInvitations &&
      !isAdmin
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.workspace) {
      // if previousValue workspace was undefined means that it's the initial render so we need to activate the animations
      this.refreshInvitations(!changes.workspace.previousValue);
    }
  }

  public refreshInvitations(activateAnimations = false) {
    const oldInvitations = this.state.get('invitations');
    const newInvitations = this.workspace.invitedProjects
      .filter((invitation) => {
        return !oldInvitations.find((oldInvitation) => {
          return oldInvitation.id === invitation.id;
        });
      })
      .map((invitation) => invitation.id);

    const removedInvitations = oldInvitations
      .filter((invitation) => {
        return !this.workspace.invitedProjects.find((oldInvitation) => {
          return oldInvitation.id === invitation.id;
        });
      })
      .map((invitation) => invitation.id);

    if (removedInvitations.length) {
      // activate slideOut & then re-render template (requestAnimationFrame) to start the :leave animation
      this.state.set({ slideOutActive: true });
      requestAnimationFrame(() => {
        if (removedInvitations.length) {
          this.animateLeavingInvitationSiblings(removedInvitations[0]);
        }

        this.state.set({
          newInvitations,
          invitations: this.workspace.invitedProjects,
        });
      });
    } else {
      this.state.set({ slideOutActive: true });

      this.state.set({
        newInvitations,
        invitations: this.workspace.invitedProjects,
      });

      if (activateAnimations) {
        // prevent animation on first render
        requestAnimationFrame(() => {
          this.animationDisabled = false;
        });
      }
    }
  }

  public trackByIndex(index: number) {
    return index;
  }
}
