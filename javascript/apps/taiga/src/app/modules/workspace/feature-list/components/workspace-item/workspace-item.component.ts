/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  animate,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import { Store } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import {
  selectLoadingWorkspaces,
  selectWorkspaceProject,
} from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { RxState } from '@rx-angular/state';
import { map, take } from 'rxjs/operators';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { selectAcceptedInvite } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';

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
  loadingWorkspaces: string[];
  workspacesSkeletonList: string[];
}

interface State {
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
}

@Component({
  selector: 'tg-workspace-item',
  templateUrl: './workspace-item.component.html',
  styleUrls: ['./workspace-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('cardSlideOut', [
      transition(':leave', [
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
    trigger('reorder', [
      transition(':enter', [style({ display: 'none' }), animate('0.3s')]),
      transition('* => moving', [
        animate(
          '0.3s linear',
          style({
            transform: 'translateX(-100%)',
          })
        ),
      ]),
    ]),
  ],
})
export class WorkspaceItemComponent implements OnInit, OnChanges {
  @Input()
  public workspace!: Workspace;

  @Input()
  public set projectsToShow(projectsToShow: number) {
    this.state.set({
      projectsToShow: projectsToShow <= 3 ? 3 : projectsToShow,
    });
  }

  public model$!: Observable<ViewModel>;

  public reorder: Record<string, string> = {};

  public animationDisabled = false;

  constructor(
    private store: Store,
    private state: RxState<State>,
    private localStorageService: LocalStorageService
  ) {}

  public get gridClass() {
    return `grid-items-${this.state.get('projectsToShow')}`;
  }

  public getRejectedInvites(): Project['slug'][] {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'general_rejected_invites'
      ) ?? []
    );
  }

  public setRejectedInvites(rejectedInvites: string[]) {
    this.localStorageService.set('general_rejected_invites', rejectedInvites);
    this.state.set({ rejectedInvites });
  }

  public ngOnInit() {
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
        if (this.workspace.myRole === 'admin') {
          invitations = [];
        } else {
          if (this.workspace.myRole === 'member') {
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
        };
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

  public acceptProjectInvite(slug: Project['slug']) {
    this.store.dispatch(
      acceptInvitationSlug({
        slug,
      })
    );
  }

  public rejectProjectInvite(slug: Project['slug']) {
    this.state.set({ slideOutActive: true });
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
    }

    const rejectedInvites = this.getRejectedInvites();
    rejectedInvites.push(slug);

    this.setRejectedInvites(rejectedInvites);
  }

  public reorderDone(event: AnimationEvent) {
    if (event.fromState === null && event.toState === 'moving') {
      this.reorder = {};
    }
  }

  public slideOutAnimationDone() {
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
    const rejectedInvites = this.getRejectedInvites();

    return invitations.filter((invitation) => {
      return !rejectedInvites.includes(invitation.slug);
    });
  }

  public userHasNoAccess() {
    const hasProjects = this.workspace.hasProjects;
    const latestProjects = this.workspace.latestProjects.length;
    const isSlideOutAnimationActive = this.state.get('slideOutActive');
    const isAdmin = this.workspace.myRole === 'admin';
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
    const isAdmin = this.workspace.myRole === 'admin';

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
      const rejectedInvites = this.getRejectedInvites();

      this.state.set({
        invitations: this.workspace.invitedProjects,
        rejectedInvites,
      });
    }
  }

  public trackByIndex(index: number) {
    return index;
  }
}
