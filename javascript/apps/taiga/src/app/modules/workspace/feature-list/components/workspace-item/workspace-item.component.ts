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
import { RxState } from '@rx-angular/state';
import { Workspace, WorkspaceProject } from '@taiga/data';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { selectWorkspaceProject } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';

interface ViewModel {
  projectsToShow: number;
  showAllProjects: boolean;
  projects: WorkspaceProject[];
}

@Component({
  selector: 'tg-workspace-item',
  templateUrl: './workspace-item.component.html',
  styleUrls: ['./workspace-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceItemComponent implements OnInit {
  @Input()
  public workspace!: Workspace;

  @Input()
  public set projectsToShow(projectsToShow: number) {
    this.state.set({ projectsToShow });
  }

  public model$!: Observable<ViewModel>;

  public get gridClass() {
    return `grid-items-${this.state.get('projectsToShow')}`;
  }

  constructor(private store: Store, private state: RxState<ViewModel>) {
    this.state.set({
      projectsToShow: 6,
    });
  }

  public ngOnInit() {
    const workspaceProjects$ = this.store.select(
      selectWorkspaceProject(this.workspace.slug)
    );

    this.model$ = combineLatest([this.state.select(), workspaceProjects$]).pipe(
      map(([state, projects]) => {
        if (!state.showAllProjects) {
          projects = projects.slice(
            0,
            state.projectsToShow <= 3 ? 3 : state.projectsToShow
          );
        }

        return {
          ...state,
          projects,
        };
      })
    );
  }

  public trackByLatestProject(index: number, project: WorkspaceProject) {
    return project.slug;
  }

  public setShowAllProjects(showAllProjects: boolean) {
    this.state.set({ showAllProjects });
    this.store.dispatch(fetchWorkspaceProjects({ slug: this.workspace.slug }));
  }
}
