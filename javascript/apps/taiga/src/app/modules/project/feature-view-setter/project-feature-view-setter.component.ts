/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { fetchStory } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectStoryView } from '~/app/modules/project/data-access/+state/selectors/project.selectors';

@Component({
  selector: 'tg-project-feature-view-setter',
  templateUrl: './project-feature-view-setter.component.html',
  styleUrls: ['./project-feature-view-setter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectFeatureViewSetterComponent {
  public storyView$ = this.store.select(selectStoryView);
  public isKanban = false;

  constructor(private store: Store, private route: ActivatedRoute) {
    const url = window.location.href;
    this.isKanban = url.includes('kanban');
    if (!this.isKanban) {
      const projectSlug = url.match(/(?<=project\/)[^/]+/)![0];
      const storyRef = +url.match(/(?<=stories\/)[^/]+/)![0];
      this.store.dispatch(
        fetchStory({
          projectSlug,
          storyRef,
        })
      );
    }
  }
}
