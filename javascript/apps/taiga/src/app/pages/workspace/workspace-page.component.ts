/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { getWorkspaceList } from '~/app/features/workspace/actions/workspace.actions';
import { selectWorkspaces } from '~/app/features/workspace/selectors/workspace.selectors';

@Component({
  selector: 'tg-workspace-page',
  templateUrl: './workspace-page.component.html',
  styleUrls: ['./workspace-page.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({flex: '0 0 0'}),
        animate('200ms ease-in', style({flex: '0 0 383px'}))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({flex: '0 0 0'}))
      ])
    ])
  ]

})
export class WorkspacePageComponent implements OnInit {
  constructor(
    private store: Store,
  ) {}

  public showActivity = false;
  public workspaceList$ = this.store.select(selectWorkspaces);

  public ngOnInit() {
    // TODO: this should be updated with user ID
    const id = 5;
    this.store.dispatch(getWorkspaceList({id}));
  }

  public toggleActivity(show: boolean) {
    this.showActivity = show;
  }
}
