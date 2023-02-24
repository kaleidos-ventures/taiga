/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'tg-projects-settings-feature-integrations',
  templateUrl: './feature-integrations.component.html',
  styleUrls: [
    './feature-integrations.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSettingsFeatureIntegrationsComponent implements OnInit {
  public ngOnInit(): void {
    console.log('project integrations feature');
  }
}
