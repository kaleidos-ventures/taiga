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
import { Project, Workspace } from '@taiga/data';
import { ResizedEvent } from 'angular-resize-event';
import {
  selectWorkspace,
  selectWorkspaceInvitedProjects,
  selectWorkspaceProjects,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import {
  fetchWorkspace,
  resetWorkspace,
} from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';
import { filterNil } from '~/app/shared/utils/operators';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

@UntilDestroy()
@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  public readonly model$ = this.state.select();
  public amountOfProjectsToShow = 6;

  public wsRejectedInvites: Project['slug'][] = [];
  public invitations: Project[] = [];

  public get gridClass() {
    return `grid-items-${this.amountOfProjectsToShow}`;
  }

  public get getWsRejectedInvites(): Project['slug'][] {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'workspace_rejected_invites'
      ) ?? []
    );
  }

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private localStorageService: LocalStorageService,
    private state: RxState<{
      projectsToShow: boolean;
      workspace: Workspace | null;
      projects: Project[];
      invitedProjects: Project[];
    }>
  ) {}

  public ngOnInit(): void {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      const slug = params.get('slug');

      if (slug) {
        this.store.dispatch(fetchWorkspace({ slug }));
      }
    });

    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
    this.state.connect('projects', this.store.select(selectWorkspaceProjects));
    this.state.connect(
      'invitedProjects',
      this.store.select(selectWorkspaceInvitedProjects)
    );

    this.wsRejectedInvites = this.getWsRejectedInvites;

    this.state.hold(
      this.store.select(selectWorkspaceInvitedProjects),
      (invitedProjects) => {
        this.invitations = invitedProjects.filter((project) => {
          return !this.wsRejectedInvites.includes(project.slug);
        });
      }
    );
  }

  public trackByLatestProject(index: number, project: Project) {
    return project.slug;
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = amount >= 6 ? 6 : amount;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

  public rejectInvitedProject(slug: Project['slug']) {
    this.wsRejectedInvites.push(slug);
    this.localStorageService.set(
      'workspace_rejected_invites',
      this.wsRejectedInvites
    );
    const invitationsIndex = this.invitations.findIndex((invite, index) => {
      if (invite.slug === slug) {
        return index;
      }
      return null;
    });
    this.invitations.splice(invitationsIndex, 1);
  }

  public ngOnDestroy() {
    this.store.dispatch(resetWorkspace());
  }
}
