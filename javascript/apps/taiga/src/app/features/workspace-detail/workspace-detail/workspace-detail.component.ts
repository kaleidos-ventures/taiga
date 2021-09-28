/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Workspace } from '@taiga/data';

@Component({
  selector: 'tg-workspace-detail',
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceDetailComponent {

  @Input()
  public workspace!: Workspace;

}
