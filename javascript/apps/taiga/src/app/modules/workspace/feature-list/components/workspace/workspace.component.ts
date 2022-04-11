/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Workspace } from '@taiga/data';
import { ResizedEvent } from 'angular-resize-event';
import { map } from 'rxjs/operators';
import {
  fadeIntOutAnimation,
  slideIn,
  slideInOut,
} from '~/app/shared/utils/animations';
import {
  selectCreateFormHasError,
  selectCreatingWorkspace,
  selectLoadingWorkpace,
  selectWorkspaces,
} from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import {
  fetchWorkspaceList,
  resetWorkspace,
} from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';

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
      state('skeleton', style({ blockSize: '188px' })),
      transition('nothing <=> create, skeleton <=> create', animate(200)),
      transition('nothing <=> skeleton', animate(0)),
    ]),
    trigger('slidePanelInOut', [
      transition(':enter', [
        style({ flex: '0 0 0' }),
        animate('200ms ease-in', style({ flex: '0 0 383px' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ flex: '0 0 0' })),
      ]),
    ]),
  ],
})
export class WorkspaceComponent implements OnDestroy {
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
    })
  );

  public amountOfProjectsToShow = 4;

  constructor(
    private store: Store,
    private state: RxState<{
      creatingWorkspace: boolean;
      showCreate: boolean;
      loading: boolean;
      workspaceList: Workspace[];
      showActivity: boolean;
      createFormHasError: boolean;
    }>
  ) {
    this.store.dispatch(fetchWorkspaceList());

    this.state.connect('workspaceList', this.store.select(selectWorkspaces));
    this.state.connect(
      'creatingWorkspace',
      this.store.select(selectCreatingWorkspace)
    );
    this.state.connect('loading', this.store.select(selectLoadingWorkpace));
    this.state.connect(
      'createFormHasError',
      this.store.select(selectCreateFormHasError)
    );
  }

  public toggleActivity(showActivity: boolean) {
    this.state.set({ showActivity });
  }

  public setCreate(showCreate: boolean) {
    this.state.set({ showCreate });
  }

  public trackByWorkspace(index: number, workspace: Workspace) {
    return workspace.slug;
  }

  public onResized(event: ResizedEvent) {
    this.setCardAmounts(event.newRect.width);
  }

  public setCardAmounts(width: number) {
    const amount = Math.ceil(width / 250);
    this.amountOfProjectsToShow = amount >= 6 ? 6 : amount;
  }

  public ngOnDestroy() {
    this.store.dispatch(resetWorkspace());
  }
}
