/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tg-feature-settings',
  templateUrl: './feature-settings.component.html',
  styleUrls: ['./feature-settings.component.css']
})
export class ProjectsSettingsFeatureSettingsComponent implements OnInit {

  public ngOnInit() {
    console.log('settings work');
  }

}
