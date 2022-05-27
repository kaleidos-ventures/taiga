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
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Project, Workspace, WorkspaceProject } from '@taiga/data';
import { Observable } from 'rxjs';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { selectWorkspaceProject } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

@Component({
  selector: 'tg-workspace-item',
  templateUrl: './workspace-item.component.html',
  styleUrls: ['./workspace-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceItemComponent implements OnInit {
  @Input()
  public workspace!: Workspace;

  @Input()
  public projectsToShow!: number;

  public showAllProjects = false;

  public workspaceProjects$!: Observable<WorkspaceProject[]>;

  public rejectedInvites: Project['slug'][] = [];

  public invitations: Workspace['invitedProjects'] = [];

  constructor(
    private store: Store,
    private localStorageService: LocalStorageService
  ) {}

  public get getRejectedInvites(): Project['slug'][] {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'rejected_invites'
      ) ?? []
    );
  }

  public ngOnInit() {
    this.workspaceProjects$ = this.store.select(
      selectWorkspaceProject(this.workspace.slug)
    );

    this.rejectedInvites = this.getRejectedInvites;

    this.invitations = this.workspace.invitedProjects.filter((project) => {
      return !this.rejectedInvites.includes(project.slug);
    });
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.slug;
  }

  public rejectProjectInvite(slug: Project['slug']) {
    this.rejectedInvites.push(slug);
    this.localStorageService.set('rejected_invites', this.rejectedInvites);
    const invitationsIndex = this.invitations.findIndex((invite, index) => {
      if (invite.slug === slug) {
        return index;
      }
      return null;
    });
    this.invitations.splice(invitationsIndex, 1);
  }

  public setShowAllProjects(showAllProjects: boolean) {
    this.showAllProjects = showAllProjects;
    this.store.dispatch(fetchWorkspaceProjects({ slug: this.workspace.slug }));
  }
}
