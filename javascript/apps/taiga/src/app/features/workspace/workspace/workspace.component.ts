/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Output, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Workspace } from '@taiga/data';
import { fadeIntOutAnimation, slideIn, slideInOut } from '~/app/shared/utils/animations';
import { selectWorkspaceSkeleton } from '../selectors/workspace.selectors';

@Component({
  selector: 'tg-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    slideInOut,
    fadeIntOutAnimation,
    slideIn
  ]
})
export class WorkspaceComponent {
  @Input()
  public workspaceList!: Workspace[];

  @Output()
  public hideActivity = new EventEmitter<boolean>();

  public showCreate = false;
  public showSkeleton$ = this.store.select(selectWorkspaceSkeleton);

  constructor(
    private store: Store,
  ) {}

  public toggleActivity(show: boolean) {
    this.hideActivity.next(show);
  }

  public toggleCreate(show: boolean) {
    this.showCreate = show;
  }

  public trackByWorkspace(index: number, workspace: Workspace) {
    return workspace.slug;
  }
}
