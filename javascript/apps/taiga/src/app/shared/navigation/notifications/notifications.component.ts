/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { UserActions } from '~/app/modules/auth/data-access/+state/actions/user.actions';
import { RxState } from '@rx-angular/state';
import { NotificationType, Project } from '@taiga/data';
import { authFeature } from '~/app/modules/auth/data-access/+state/reducers/auth.reducer';
import { trackByIndex } from '~/app/shared/utils/track-by-index';
import { NotificationComponent } from '../notification/notification.component';

interface ComponentState {
  notifications: NotificationType[];
  project: Project;
}

@Component({
  selector: 'tg-notifications',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, NotificationComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class NotificationsComponent {
  private store = inject(Store);
  private state = inject(RxState) as RxState<ComponentState>;
  public model$ = this.state.select();
  public trackByIndex = trackByIndex();

  constructor() {
    this.store.dispatch(UserActions.initNotificationSection());

    this.state.connect(
      'notifications',
      this.store.select(authFeature.selectNotifications)
    );
  }
}
