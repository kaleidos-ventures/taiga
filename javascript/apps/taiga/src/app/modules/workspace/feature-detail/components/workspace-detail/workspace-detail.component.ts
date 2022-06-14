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
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { ResizedEvent } from 'angular-resize-event';
import {
  selectLoading,
  selectWorkspace,
  selectWorkspaceInvitedProjects,
  selectWorkspaceProjects,
  selectCreatingWorkspaceDetail,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import {
  fetchWorkspace,
  resetWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import { filterNil } from '~/app/shared/utils/operators';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  animate,
  style,
  transition,
  trigger,
  AnimationEvent,
} from '@angular/animations';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { selectAcceptedInvite } from '~/app/shared/invite-to-project/data-access/+state/selectors/invitation.selectors';

interface ViewDetailModel {
  projects: WorkspaceProject[];
  workspace: Workspace | null;
  invitedProjects: WorkspaceProject[];
  creatingWorkspaceDetail: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideOut', [
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
  providers: [RxState],
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  public loading$ = this.store.select(selectLoading);
  public model$!: Observable<ViewDetailModel>;

  public amountOfProjectsToShow = 10;

  public animationDisabled = true;

  public invitations: WorkspaceProject[] = [];

  public reorder: Record<string, string> = {};

  public get gridClass() {
    return `grid-items-${this.amountOfProjectsToShow}`;
  }

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private localStorageService: LocalStorageService,
    private state: RxState<{
      workspace: Workspace | null;
      projects: WorkspaceProject[];
      invitedProjects: WorkspaceProject[];
      rejectedInvites: string[];
      acceptedInvites: string[];
      creatingWorkspaceDetail: boolean;
      skeletonAnimation: string;
    }>
  ) {}

  public ngOnInit(): void {
    const rejectedInvites = this.getRejectedInvites();

    this.state.set({
      rejectedInvites,
    });

    this.model$ = this.state.select().pipe(
      map((state) => {
        let invitedProjects = state.invitedProjects;
        let projects = state.projects;

        // ignore previously accepted invitations
        projects = projects.filter(
          (project) => !state.acceptedInvites.includes(project.slug)
        );

        // workspace admin may have an invitation to a project that it already has access to.
        if (state.workspace?.myRole === 'admin') {
          invitedProjects = [];
        } else {
          if (state.workspace?.myRole === 'member') {
            // a member can have some projects in both list because the project could have access permissions for workspace members
            invitedProjects = invitedProjects.filter((invitation) => {
              return !projects.find((project) => {
                return project.slug === invitation.slug;
              });
            });
          } else {
            projects = projects.filter((project) => {
              return !invitedProjects.find((invitation) => {
                return project.slug === invitation.slug;
              });
            });
          }

          invitedProjects = invitedProjects.filter((invitation) => {
            return !state.rejectedInvites.includes(invitation.slug);
          });
        }

        if (!state.creatingWorkspaceDetail) {
          requestAnimationFrame(() => {
            this.animationDisabled = false;
          });
        }
        return {
          ...state,
          projects,
          invitedProjects,
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
    this.state.connect('projects', this.store.select(selectWorkspaceProjects));
    this.state.connect(
      'invitedProjects',
      this.store.select(selectWorkspaceInvitedProjects)
    );
  }

  public getRejectedInvites(): Project['slug'][] {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'workspace_rejected_invites'
      ) ?? []
    );
  }

  public setRejectedInvites(rejectedInvites: string[]) {
    this.localStorageService.set('workspace_rejected_invites', rejectedInvites);
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

  public acceptProjectInvite(slug: Project['slug']) {
    this.store.dispatch(
      acceptInvitationSlug({
        slug,
      })
    );
  }

  public rejectProjectInvite(slug: Project['slug']) {
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

  public getSiblingsRow(slug: string) {
    const projectsToShow = this.amountOfProjectsToShow;
    let vm!: ViewDetailModel;

    this.model$.pipe(take(1)).subscribe((model) => {
      vm = model;
    });

    const result = [...vm.invitedProjects, ...vm.projects].reduce(
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
}
