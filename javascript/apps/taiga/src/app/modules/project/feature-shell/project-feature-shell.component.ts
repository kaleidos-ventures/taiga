/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { WsService } from '@taiga/ws';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
import { setNotificationClosed } from '../feature-overview/data-access/+state/actions/project-overview.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'tg-project-feature-shell',
  templateUrl: './project-feature-shell.component.html',
  styleUrls: ['./project-feature-shell.component.css'],
  providers: [RxState],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({
          blockSize: '0',
          opacity: 0,
        }),
        animate(
          '300ms',
          style({
            blockSize: '110',
            opacity: 1,
          })
        ),
      ]),
      transition(':leave', [
        style({
          blockSize: '110',
          opacity: 1,
        }),
        animate(
          '300ms',
          style({
            blockSize: '0',
            opacity: 0,
          })
        ),
      ]),
    ]),
  ],
})
export class ProjectFeatureShellComponent implements OnDestroy, AfterViewInit {
  public model$ = this.state.select();
  public subscribedProject?: string;
  public animationDisabled = true;

  constructor(
    private router: Router,
    private store: Store,
    private wsService: WsService,
    private state: RxState<{
      project: Project;
    }>,
    private userStorageService: UserStorageService
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.hold(this.state.select('project'), (project) => {
      if (project.userIsMember) {
        this.unsubscribeFromProjectEvents();
        this.subscribedProject = project.slug;
        this.wsService
          .command('subscribe_to_project_events', { project: project.slug })
          .subscribe();

        this.store.dispatch(
          setNotificationClosed({
            notificationClosed: !this.showPendingInvitationNotification,
          })
        );
      }
    });
  }

  public get showPendingInvitationNotification() {
    return !this.getRejectedOverviewInvites().includes(this.subscribedProject!);
  }

  public getRejectedOverviewInvites() {
    return (
      this.userStorageService.get<Project['slug'][] | undefined>(
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

  public ngAfterViewInit() {
    setTimeout(() => {
      this.animationDisabled = false;
    }, 1000);
  }

  public onNotificationClosed() {
    const rejectedInvites = this.getRejectedOverviewInvites();
    rejectedInvites.push(this.subscribedProject!);
    this.userStorageService.set('overview_rejected_invites', rejectedInvites);
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
