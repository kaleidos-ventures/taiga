/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { fetchProject } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { Component, OnInit, } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-detail',
  templateUrl: './project-feature-detail.component.html',
  styleUrls: ['./project-feature-detail.component.css']
})
export class ProjectFeatureDetailComponent implements OnInit {
  constructor(
    private store: Store,
    private route: ActivatedRoute,
  ) {}

  public project$ = this.store.select(selectProject);

  public ngOnInit() {
    this.route.paramMap
      .pipe(untilDestroyed(this))
      .subscribe((params) => {
        this.store.dispatch(fetchProject({ slug: params.get('slug')! }));
      });
  }
}
