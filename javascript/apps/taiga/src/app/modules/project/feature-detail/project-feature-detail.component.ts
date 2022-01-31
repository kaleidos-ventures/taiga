/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
@Component({
  selector: 'tg-project-feature-detail',
  templateUrl: './project-feature-detail.component.html',
  styleUrls: ['./project-feature-detail.component.css'],
})
export class ProjectFeatureDetailComponent {
  constructor(private store: Store) {}

  public project$ = this.store.select(selectCurrentProject);
}
