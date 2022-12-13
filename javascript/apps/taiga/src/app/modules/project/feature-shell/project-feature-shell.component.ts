/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Membership, Project } from '@taiga/data';
import { filter, merge } from 'rxjs';
import {
  selectCurrentProject,
  selectShowBannerOnRevoke,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { WsService } from '~/app/services/ws';
import { acceptInvitationId } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { UserStorageService } from '~/app/shared/user-storage/user-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
import {
  newProjectMembers,
  permissionsUpdate,
} from '../data-access/+state/actions/project.actions';
import { setNotificationClosed } from '../feature-overview/data-access/+state/actions/project-overview.actions';

@UntilDestroy()
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
    private store: Store,
    private wsService: WsService,
    private cd: ChangeDetectorRef,
    private state: RxState<{
      project: Project;
      showBannerOnRevoke: boolean;
    }>,
    private userStorageService: UserStorageService
  ) {
    this.watchProject();
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.connect(
      'showBannerOnRevoke',
      this.store.select(selectShowBannerOnRevoke).pipe(filterNil())
    );

    this.state.hold(this.state.select('project'), (project) => {
      this.subscribedProject = project.id;
      this.unsubscribeFromProjectEvents();
      this.wsService
        .command('subscribe_to_project_events', { project: project.id })
        .subscribe();

      this.store.dispatch(
        setNotificationClosed({
          notificationClosed: !this.showPendingInvitationNotification,
        })
      );
    });
  }

  public get showPendingInvitationNotification() {
    return !this.getRejectedOverviewInvites().includes(this.subscribedProject!);
  }

  public watchProject() {
    merge(
      this.wsService
        .userEvents<{ project: string }>('projectmemberships.update')
        .pipe(
          filter((data) => {
            return data.event.content.project === this.state.get('project').id;
          })
        ),
      this.wsService.projectEvents('projects.permissions.update'),
      this.wsService.projectEvents('projectroles.update')
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(
          permissionsUpdate({ id: this.state.get('project').id })
        );
      });

    this.wsService
      .projectEvents<{ members: Membership[] }>('projectmemberships.create')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.dispatch(newProjectMembers());
      });

    // todo: not working, made up. Back is going to do this?
    this.wsService
      .projectEvents<{ members: Membership[] }>('story.asign.update')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        // new assigne // delete assigne
      });
  }

  public getRejectedOverviewInvites() {
    return (
      this.userStorageService.get<Project['id'][] | undefined>(
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
      this.cd.detectChanges();
    }, 1000);
  }

  public onNotificationClosed() {
    const rejectedInvites = this.getRejectedOverviewInvites();
    rejectedInvites.push(this.subscribedProject!);
    this.userStorageService.set('overview_rejected_invites', rejectedInvites);
    this.store.dispatch(setNotificationClosed({ notificationClosed: true }));
  }

  public acceptInvitationId() {
    this.store.dispatch(
      acceptInvitationId({
        id: this.state.get('project').id,
        isBanner: true,
      })
    );
  }
}
