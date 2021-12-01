/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'tg-projects-settings-feature-roles-permissions',
  templateUrl: './feature-roles-permissions.component.html',
  styleUrls: [
    './feature-roles-permissions.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSettingsFeatureRolesPermissionsComponent implements OnInit
{
  public ngOnInit(): void {
    console.log('project roles permissions feature');
  }
}
