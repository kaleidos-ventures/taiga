/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
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
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { randUserName } from '@ngneat/falso';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  acceptInvitationEvent,
  fetchWorkspaceInvitationsSuccess,
  fetchWorkspaceProjects,
  invitationCreateEvent,
  invitationRevokedEvent,
  setWorkspaceListRejectedInvites,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import {
  selectLoadingWorkspaces,
  selectRejectedInvites,
  selectWorkspaceProject,
} from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { selectAcceptedInvite } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';
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
  implements OnInit, OnChanges, AfterViewInit
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
    private cd: ChangeDetectorRef
  ) {
    this.state.set({
      rejectedInvites: [],
      invitations: [],
      projectSiblingToAnimate: [],
      slideOutActive: false,
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
      this.store.select(selectAcceptedInvite)
    );
    this.state.connect(
      'workspaceProjects',
      this.store.select(selectWorkspaceProject(this.workspace.slug))
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
        if (state.loadingWorkspaces.includes(this.workspace.slug)) {
          this.animationDisabled = true;
        }

        let invitations = state.invitations;
        let projects = state.workspaceProjects;
        // ignore previously accepted invitations
        projects = projects.filter(
          (project) => !state.acceptedInvites.includes(project.slug)
        );

        // workspace admin/member may have an invitation to a project that it already has access to.
        if (this.workspace.userRole === 'admin') {
          invitations = [];
        } else {
          if (this.workspace.userRole === 'member') {
            // a member can have some projects in both list because the project could have access permissions for workspace members
            invitations = invitations.filter((invitation) => {
              return !projects.find((project) => {
                return project.slug === invitation.slug;
              });
            });
          } else {
            projects = projects.filter((project) => {
              return !invitations.find((invitation) => {
                return project.slug === invitation.slug;
              });
            });
          }

          invitations = invitations.filter((invitation) => {
            return !state.rejectedInvites.includes(invitation.slug);
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

        const workspacesSkeletonList = state.loadingWorkspaces;

        if (!state.loadingWorkspaces.includes(this.workspace.slug)) {
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
  }

  public newProjectAnimationStart(
    event: AnimationEvent,
    project: WorkspaceProject
  ) {
    if (event.fromState !== 'void' || this.state.get('slideOutActive')) {
      return;
    }

    const siblings = this.getSiblingsRow(project.slug);

    if (siblings) {
      this.state.set({
        projectSiblingToAnimate: siblings
          .filter((it) => it.slug !== project.slug)
          .map((it) => it.slug),
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

  public wsEvent(event: string, projectSlug: string, workspaceSlug: string) {
    if (this.workspace.slug === workspaceSlug) {
      if (event === 'projectinvitations.create') {
        this.invitationCreateEvent(projectSlug, workspaceSlug);
      } else if (event === 'projectmemberships.create') {
        this.membershipCreateEvent(projectSlug);
      } else if (event === 'projectinvitations.revoke') {
        this.invitationRevokedEvent(projectSlug);
      }
    }
    this.cd.detectChanges();
  }

  public invitationRevokedEvent(project: string) {
    const invitations = [...this.state.get('invitations')];
    const workspaceInvitations = invitations.filter(
      (workspaceInvitation) => workspaceInvitation.slug !== project
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
    projectSlug: string,
    workspaceSlug: string,
    fake?: boolean
  ) {
    if (fake) {
      const projectName = randUserName();
      const fakeInvitation: WorkspaceProject = {
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
          projectSlug: projectName,
          workspaceSlug: workspaceSlug,
          project: [fakeInvitation as Project],
          invitations: [fakeInvitation as Project],
          role: this.workspace.userRole,
          rejectedInvites: this.state.get('rejectedInvites'),
        })
      );
    } else {
      if (this.workspace.userRole === 'admin') {
        this.newProjectsToAnimate.push(projectSlug);
      }
      this.store.dispatch(
        invitationCreateEvent({
          projectSlug: projectSlug,
          workspaceSlug: workspaceSlug,
          role: this.workspace.userRole,
          rejectedInvites: this.state.get('rejectedInvites'),
        })
      );
    }
  }

  public membershipCreateEvent(projectSlug: string) {
    this.store.dispatch(
      acceptInvitationEvent({
        projectSlug,
      })
    );
  }

  public getSiblingsRow(slug: string) {
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
      return chunk.find((project) => project.slug === slug);
    });
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.slug;
  }

  public acceptProjectInvite(slug: Project['slug'], name: Project['name']) {
    this.store.dispatch(
      acceptInvitationSlug({
        slug,
        name,
      })
    );
  }

  public animateLeavingInvitationSiblings(slug: string) {
    const siblings = this.getSiblingsRow(slug);
    if (siblings) {
      const rejectedIndex = siblings.findIndex(
        (project) => project.slug === slug
      );
      siblings.forEach((project, index) => {
        if (index > rejectedIndex) {
          this.reorder[project.slug] = 'moving';
        }
      });

      let vm!: ViewModel;

      this.model$.pipe(take(1)).subscribe((model) => {
        vm = model;
      });

      const projectsToShow = this.state.get('projectsToShow');
      const newProjectInTopLine = vm.allVisibleProjects[projectsToShow];

      if (newProjectInTopLine) {
        this.reorder[newProjectInTopLine.slug] = 'entering';
      }
    }
  }

  public rejectProjectInvite(slug: Project['slug']) {
    this.state.set({ slideOutActive: true });

    requestAnimationFrame(() => {
      this.animateLeavingInvitationSiblings(slug);
      const rejectedInvites = [...this.state.get('rejectedInvites')];
      rejectedInvites.push(slug);
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
      this.store.dispatch(
        fetchWorkspaceProjects({ slug: this.workspace.slug })
      );
    }
  }

  public getActiveInvitations() {
    const invitations = this.state.get('invitations');
    const rejectedInvites = this.state.get('rejectedInvites');

    return invitations.filter((invitation) => {
      return !rejectedInvites.includes(invitation.slug);
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
          return oldInvitation.slug === invitation.slug;
        });
      })
      .map((invitation) => invitation.slug);

    const removedInvitations = oldInvitations
      .filter((invitation) => {
        return !this.workspace.invitedProjects.find((oldInvitation) => {
          return oldInvitation.slug === invitation.slug;
        });
      })
      .map((invitation) => invitation.slug);

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
