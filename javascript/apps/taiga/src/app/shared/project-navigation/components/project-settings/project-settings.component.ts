/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'tg-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSettingsComponent {
  @Output()
  public closeMenu = new EventEmitter<void>();
}
