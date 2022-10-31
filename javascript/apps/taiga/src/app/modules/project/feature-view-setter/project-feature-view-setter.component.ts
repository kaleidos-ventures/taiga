/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
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
export class ProjectFeatureViewSetterComponent implements OnDestroy {
  public storyView$ = this.store.select(selectStoryView);
  public isKanban = false;
  public destroyOnLocationChange: () => void;

  constructor(private store: Store, private location: Location) {
    const url = window.location.href;
    this.isKanban = url.includes('kanban');

    this.destroyOnLocationChange = this.location.onUrlChange((url) => {
      this.isKanban = url.includes('kanban');
      const isStory = url.includes('/stories');

      if (isStory) {
        this.fetchStory();
        setTimeout(() => {
          const mainFocus = document.querySelector('.story-detail-focus');

          if (mainFocus) {
            (mainFocus as HTMLElement).focus();
          }
        }, 400);
      }
    });

    if (!this.isKanban) {
      this.fetchStory();
    }
  }

  public ngOnDestroy(): void {
    this.destroyOnLocationChange();
  }

  private fetchStory() {
    const params = this.getUrlParams();

    this.store.dispatch(
      fetchStory({
        projectSlug: params.projectSlug,
        storyRef: params.storyRef,
      })
    );
  }

  private getUrlParams() {
    const url = window.location.href;

    return {
      projectSlug: url.match(/(?<=project\/)[^/]+/)![0],
      storyRef: +url.match(/(?<=stories\/)[^/]+/)![0],
    };
  }
}
