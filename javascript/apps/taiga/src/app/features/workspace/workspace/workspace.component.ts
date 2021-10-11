/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Workspace } from '@taiga/data';
import { map } from 'rxjs/operators';
import { fadeIntOutAnimation, slideIn, slideInOut } from '~/app/shared/utils/animations';
import { selectCreatingWorkspace, selectLoadingWorkpace } from '../selectors/workspace.selectors';

@Component({
  selector: 'tg-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    slideInOut,
    fadeIntOutAnimation,
    slideIn,
    trigger('skeletonAnimation', [
      state('nothing', style({ blockSize: '0' })),
      state('create', style({ blockSize: '123px' })),
      state('skeleton', style({ blockSize: '202px' })),
      transition('nothing <=> create, skeleton <=> create', animate(200)),
      transition('nothing <=> skeleton', animate(0))
    ])
  ]
})
export class WorkspaceComponent {
  public readonly model$ = this.state.select().pipe(
    map((model) => {
      let skeletonAnimation = 'nothing';

      if (model.workspaceList.length) {
        if (model.creatingWorkspace) {
          skeletonAnimation = 'skeleton';
        } else if (model.showCreate) {
          skeletonAnimation = 'create';
        }
      }

      return {
        ...model,
        skeletonAnimation,
      };
    }),
  );

  @Input()
  public set workspaceList(workspaceList: Workspace[]) {
    this.state.set({ workspaceList });
  };

  @Output()
  public hideActivity = new EventEmitter<boolean>();

  constructor(
    private store: Store,
    private state: RxState<{
      creatingWorkspace: boolean,
      showCreate: boolean,
      loading: boolean,
      workspaceList: Workspace[],
    }>,
  ) {
    this.state.connect('creatingWorkspace', this.store.select(selectCreatingWorkspace));
    this.state.connect('loading', this.store.select(selectLoadingWorkpace));
  }

  public toggleActivity(show: boolean) {
    this.hideActivity.next(show);
  }

  public setCreate(showCreate: boolean) {
    this.state.set({ showCreate });
  }

  public trackByWorkspace(index: number, workspace: Workspace) {
    return workspace.slug;
  }
}
