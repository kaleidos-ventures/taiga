/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component } from '@angular/core';
import { Store } from '@ngrx/store';


@Component({
  selector: 'tg-project-orchestrator',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectOrchestratorComponent {
  constructor(
    private store: Store
  ) { }

}
