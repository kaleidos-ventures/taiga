/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { WsService } from '@taiga/ws';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filterNil } from '~/app/shared/utils/operators';

@UntilDestroy()
@Component({
  selector: 'tg-project-feature-shell',
  templateUrl: './project-feature-shell.component.html',
  styleUrls: ['./project-feature-shell.component.css'],
})
export class ProjectFeatureShellComponent implements OnDestroy {
  public subscribedProject?: string;

  constructor(private store: Store, private wsService: WsService) {
    this.project$
      .pipe(filterNil(), untilDestroyed(this))
      .subscribe((project) => {
        this.unsubscribeFromProjectEvents();

        this.subscribedProject = project.slug;
        this.wsService
          .command('subscribe_to_project_events', { project: project.slug })
          .subscribe();
      });
  }

  public project$ = this.store.select(selectCurrentProject);

  public ngOnDestroy(): void {
    this.unsubscribeFromProjectEvents();
  }

  public unsubscribeFromProjectEvents() {
    if (this.subscribedProject) {
      this.wsService
        .command('unsubscribe_from_project_events', {
          project: this.subscribedProject,
        })
        .subscribe();
    }
  }
}
