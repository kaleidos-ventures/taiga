/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { fetchProject } from '~/app/features/project/project/actions/project.actions';
import { selectProject } from '~/app/features/project/project/selectors/project.selectors';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'tg-project',
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.css']
})
export class ProjectPageComponent implements OnInit {

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
