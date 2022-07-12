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
import { filterNil } from '~/app/shared/utils/operators';
import { setNotificationClosed } from '../feature-overview/data-access/+state/actions/project-overview.actions';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { animate, style, transition, trigger } from '@angular/animations';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

@Component({
  selector: 'tg-project-feature-shell',
  templateUrl: './project-feature-shell.component.html',
  styleUrls: ['./project-feature-shell.component.css'],
  providers: [RxState],
  animations: [
    trigger('slideOut', [
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({
            blockSize: '0',
            opacity: '0',
          })
        ),
      ]),
    ]),
  ],
})
export class ProjectFeatureShellComponent implements OnDestroy {
  public model$ = this.state.select();
  public subscribedProject?: string;

  constructor(
    private store: Store,
    private wsService: WsService,
    private state: RxState<{
      project: Project;
    }>,
    private localStorageService: LocalStorageService
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.hold(this.state.select('project'), (project) => {
      this.unsubscribeFromProjectEvents();

      this.subscribedProject = project.slug;
      this.wsService
        .command('subscribe_to_project_events', { project: project.slug })
        .subscribe();
    });
  }

  public get showPendingInvitationNotification() {
    return !this.getRejectedOverviewInvites().includes(this.subscribedProject!);
  }

  public getRejectedOverviewInvites() {
    return (
      this.localStorageService.get<Project['slug'][] | undefined>(
        'overview_rejected_invites'
      ) || []
    );
  }

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

  public onNotificationClosed() {
    const rejectedInvites = this.getRejectedOverviewInvites();
    rejectedInvites.push(this.subscribedProject!);
    this.localStorageService.set('overview_rejected_invites', rejectedInvites);
    this.store.dispatch(setNotificationClosed({ notificationClosed: true }));
  }

  public acceptInvitationSlug() {
    this.store.dispatch(
      acceptInvitationSlug({
        slug: this.state.get('project').slug,
      })
    );
  }
}
