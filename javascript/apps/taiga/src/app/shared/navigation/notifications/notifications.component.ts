/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { UserActions } from '~/app/modules/auth/data-access/+state/actions/user.actions';
import { RxState } from '@rx-angular/state';
import { NotificationType, Project } from '@taiga/data';
import { authFeature } from '~/app/modules/auth/data-access/+state/reducers/auth.reducer';
import { trackByProp } from '~/app/shared/utils/track-by-prop';
import { NotificationComponent } from '../notification/notification.component';
import { TuiToggleModule } from '@taiga-ui/kit';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

interface ComponentState {
  notifications: NotificationType[];
  project: Project;
  showUnread: boolean;
  filterNotifications: NotificationType[];
}

@Component({
  selector: 'tg-notifications',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    NotificationComponent,
    TuiToggleModule,
    FormsModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class NotificationsComponent {
  private store = inject(Store);
  private localStorageService = inject(LocalStorageService);
  private state = inject(RxState) as RxState<ComponentState>;
  public model$ = this.state.select().pipe(
    map((state) => {
      return {
        notifications: state.notifications,
        project: state.project,
        showUnread: state.showUnread,
        filterNotifications: state.notifications.filter((notification) => {
          if (state.showUnread) {
            return !notification.readAt;
          }

          return true;
        }),
      };
    })
  );
  public trackById = trackByProp<NotificationType>('id');
  public set showUnread(value: boolean) {
    this.state.set({ showUnread: value });
  }
  public get showUnread() {
    return this.state.get('showUnread');
  }

  @Output()
  public userNavigated = new EventEmitter();

  constructor() {
    this.state.set({
      showUnread: this.localStorageService.get('showUnread') ?? false,
    });

    this.store.dispatch(UserActions.initNotificationSection());

    this.state.connect(
      'notifications',
      this.store.select(authFeature.selectNotifications)
    );

    this.state.hold(this.state.select('showUnread'), () => {
      this.localStorageService.set('showUnread', this.showUnread);
    });
  }
}
