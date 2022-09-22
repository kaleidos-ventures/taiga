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
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { map, pairwise, take } from 'rxjs/operators';
import {
  fetchWorkspace,
  invitationDetailCreateEvent,
  invitationDetailRevokedEvent,
  resetWorkspace,
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
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
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

  public get gridClass() {
    return `grid-items-${this.amountOfProjectsToShow}`;
  }

  constructor(
    private wsService: WsService,
    private route: ActivatedRoute,
    private store: Store,
    private userStorageService: UserStorageService,
    private state: RxState<WorkspaceDetailState>
  ) {
    this.state.set({
      rejectedInvites: [],
      invitations: [],
      projectSiblingToAnimate: [],
    });
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
          (project) => !state.acceptedInvites.includes(project.slug)
        );

        // workspace admin may have an invitation to a project that it already has access to.
        if (state.workspace?.userRole === 'admin') {
          invitations = [];
        } else {
          if (state.workspace?.userRole === 'member') {
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
      const slug = params.get('slug');

      if (slug) {
        this.store.dispatch(fetchWorkspace({ slug }));
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
  }

  public invitationRevokedEvent(projectSlug: string) {
    this.store.dispatch(
      invitationDetailRevokedEvent({
        projectSlug,
      })
    );
  }

  public invitationCreateEvent(projectSlug: string) {
    const workspace = this.state.get('workspace');
    if (workspace) {
      if (workspace.userRole === 'admin') {
        this.newProjectsToAnimate.push(projectSlug);
      }
      this.store.dispatch(
        invitationDetailCreateEvent({
          projectSlug: projectSlug,
          workspaceSlug: workspace.slug,
          role: workspace.userRole,
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

  public getRejectedInvites(): Project['slug'][] {
    return (
      this.userStorageService.get<Project['slug'][] | undefined>(
        'workspace_rejected_invites'
      ) ?? []
    );
  }

  public setRejectedInvites(rejectedInvites: string[]) {
    this.userStorageService.set('workspace_rejected_invites', rejectedInvites);
    this.state.set({ rejectedInvites });
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.slug;
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = amount >= 10 ? 10 : amount;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

  public acceptProjectInvite(slug: string, name?: string) {
    this.store.dispatch(
      acceptInvitationSlug({
        slug,
        name,
      })
    );
  }

  public rejectProjectInvite(slug: Project['slug']) {
    this.state.set({ slideOutActive: true });

    requestAnimationFrame(() => {
      this.animateLeavingInvitationSiblings(slug);
      const rejectedInvites = this.getRejectedInvites();
      rejectedInvites.push(slug);
      this.setRejectedInvites(rejectedInvites);
    });
  }

  public getSiblingsRow(slug: string) {
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
      return chunk.find((project) => project.slug === slug);
    });
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
      let vm!: ViewDetailModel;

      this.model$.pipe(take(1)).subscribe((model) => {
        vm = model;
      });

      const projectsToShow = this.amountOfProjectsToShow;
      const newProjectInTopLine = vm.allVisibleProjects[projectsToShow];

      if (newProjectInTopLine) {
        this.reorder[newProjectInTopLine.slug] = 'entering';
      }
    }
  }

  public reorderDone(event: AnimationEvent) {
    if (event.fromState === null && event.toState === 'moving') {
      this.reorder = {};
    }
  }

  public ngOnDestroy() {
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

    const siblings = this.getSiblingsRow(project.slug);

    if (siblings) {
      this.state.set({
        projectSiblingToAnimate: siblings
          .filter((it) => it.slug !== project.slug)
          .map((it) => it.slug),
      });
    }
  }

  public refreshInvitations(
    old: WorkspaceProject[],
    newInvite: WorkspaceProject[]
  ) {
    const oldInvitations = old;
    const newInvitations = newInvite
      .filter((invitation) => {
        return !oldInvitations.find((oldInvitation) => {
          return oldInvitation.slug === invitation.slug;
        });
      })
      .map((invitation) => invitation.slug);

    const removedInvitations = oldInvitations
      .filter((invitation) => {
        return !newInvite.find((oldInvitation) => {
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
          invitations: newInvite,
        });
      });
    } else {
      this.state.set({ slideOutActive: true });
      this.state.set({
        newInvitations,
        invitations: newInvite,
      });
    }
  }
}
