/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';

interface ComponentViewModel {
  todo: string;
}

@Component({
  selector: 'tg-workspace-page',
  templateUrl: './workspace-page.component.html',
  styleUrls: ['./workspace-page.component.css'],
  providers: [RxState],
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
export class WorkspacePageComponent {
  public showActivity = false;
  constructor(
    private store: Store,
    private state: RxState<ComponentViewModel>,
  ) {
    // initial state
    // this.state.set({});

    // connect the ngrx state with the local state
    // this.state.connect('todo', this.store.select(selectTodo));
  }

  public toggleActivity(show: boolean) {
    this.showActivity = show;
  }
}
