/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workspace } from '@taiga/data';
import { ResizedEvent } from 'angular-resize-event';
import { selectWorkspace, selectWorkspaceProjects } from '../selectors/workspace-detail.selectors';

@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class WorkspaceDetailComponent implements OnInit {
  public readonly model$ = this.state.select();
  public amountOfProjectsToShow = 6;

  public get gridClass() {
    return `grid-items-${this.amountOfProjectsToShow}`;
  };

  constructor(
    private store: Store,
    private state: RxState<{
      projectsToShow: boolean
      workspace: Workspace,
      project: Project[],
    }>,
  ) {}

  public ngOnInit(): void {
    this.state.connect('workspace', this.store.select(selectWorkspace));
    this.state.connect('project', this.store.select(selectWorkspaceProjects));
  }

  public trackByLatestProject(index: number, project: Project ) {
    return project.slug;
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = (amount >= 6) ? 6 : amount;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

}
