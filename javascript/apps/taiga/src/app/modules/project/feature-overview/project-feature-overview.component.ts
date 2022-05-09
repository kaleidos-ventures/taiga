/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  initProjectOverview,
  resetOverview,
  setNotificationClosed,
} from './data-access/+state/actions/project-overview.actions';
import { Invitation, Project, User } from '@taiga/data';
import { RxState } from '@rx-angular/state';
import { map } from 'rxjs/operators';
import { selectInvitations } from './data-access/+state/selectors/project-overview.selectors';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import {
  selectNotificationClosed,
  selectOnAcceptedInvitation,
} from '~/app/modules/project/feature-overview/data-access/+state/selectors/project-overview.selectors';
import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'tg-project-feature-overview',
  templateUrl: './project-feature-overview.component.html',
  styleUrls: ['./project-feature-overview.component.css'],
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
export class ProjectFeatureOverviewComponent
  implements OnInit, AfterViewChecked, OnDestroy
{
  @ViewChild('descriptionOverflow')
  public descriptionOverflow?: ElementRef;

  public readonly model$ = this.state.select().pipe(
    map((state) => {
      let invitation = null;
      if (state.user) {
        invitation = state.invitations.some((invitation) =>
          invitation.email
            ? invitation.email.toLowerCase() === state.user?.email.toLowerCase()
            : invitation.user?.username.toLowerCase() ===
              state.user?.username.toLowerCase()
        );
      }

      return {
        ...state,
        haveInvitation: invitation,
      };
    })
  );

  public showDescription = false;
  public hideOverflow = false;

  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private state: RxState<{
      project: Project;
      haveInvitation: boolean;
      invitations: Invitation[];
      notificationClosed: boolean;
      onAcceptedInvitation: boolean;
      user?: User | null;
    }>
  ) {
    this.state.connect('invitations', this.store.select(selectInvitations));
    this.state.connect('user', this.store.select(selectUser));
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'notificationClosed',
      this.store.select(selectNotificationClosed)
    );
    this.state.connect(
      'onAcceptedInvitation',
      this.store.select(selectOnAcceptedInvitation)
    );
  }

  public ngOnInit() {
    this.showDescription = false;
    this.hideOverflow = false;
    this.store.dispatch(initProjectOverview());
  }

  public hasClamping(el: HTMLElement) {
    const { clientHeight, scrollHeight } = el;
    return clientHeight !== scrollHeight;
  }

  public toggleShowDescription() {
    this.hideOverflow = !this.hideOverflow;
  }

  public ngAfterViewChecked() {
    if (this.descriptionOverflow && !this.hideOverflow) {
      this.showDescription = this.hasClamping(
        this.descriptionOverflow.nativeElement as HTMLElement
      );
      this.cd.detectChanges();
    }
  }

  public acceptInvitationSlug() {
    this.store.dispatch(
      acceptInvitationSlug({
        slug: this.state.get('project').slug,
      })
    );
  }

  public onNotificationClosed() {
    this.store.dispatch(setNotificationClosed({ notificationClosed: true }));
  }

  public ngOnDestroy() {
    this.store.dispatch(resetOverview());
  }
}
