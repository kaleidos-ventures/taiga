/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Workspace } from '@taiga/data';
import { RxState } from '@rx-angular/state';
import {
  selectWorkspace,
  selectTotalMembers,
} from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';
import { workspaceDetailApiActions } from '~/app/modules/workspace/feature-detail/+state/actions/workspace-detail.actions';

interface WorkspaceDetailState {
  workspace: Workspace | null;
  totalMembers: number;
}
@Component({
  selector: 'tg-workspace-detail-people',
  templateUrl: './workspace-detail-people.component.html',
  styleUrls: ['./workspace-detail-people.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class WorkspaceDetailPeopleComponent implements OnInit {
  public model$ = this.state.select();
  public selectedTab = 1;

  constructor(
    private state: RxState<WorkspaceDetailState>,
    private store: Store
  ) {}

  public ngOnInit(): void {
    this.state.connect(
      'workspace',
      this.store.select(selectWorkspace).pipe(filterNil())
    );
    this.state.connect('totalMembers', this.store.select(selectTotalMembers));

    this.state.hold(this.state.select('workspace'), (workspace) => {
      if (workspace) {
        this.store.dispatch(
          workspaceDetailApiActions.initWorkspaceMembers({
            id: workspace.id,
            offset: 0,
          })
        );
      }
    });
  }
}
