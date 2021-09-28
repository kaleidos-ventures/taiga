/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { getWorkspace } from '~/app/features/workspace/actions/workspace.actions';
import { selectWorkspace } from '~/app/features/workspace/selectors/workspace.selectors';

@Component({
  selector: 'tg-workspace-detail-page',
  templateUrl: './workspace-detail-page.component.html',
  styleUrls: ['./workspace-detail-page.component.css']
})
export class WorkspaceDetailPageComponent implements OnInit {
  
  constructor(
    private store: Store,
    private route: ActivatedRoute,
  ) {}

  public workspace$ = this.store.select(selectWorkspace);

  public ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(getWorkspace({id}));
  }
}
