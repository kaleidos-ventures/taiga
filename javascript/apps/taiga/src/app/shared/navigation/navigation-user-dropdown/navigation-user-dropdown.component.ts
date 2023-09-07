/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  EventEmitter,
  Output,
} from '@angular/core';
import { User } from '@taiga/data';
import { RouterLink } from '@angular/router';

import { TuiDataListModule } from '@taiga-ui/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';
import { AutoFocusDirective } from '~/app/shared/directives/auto-focus/auto-focus.directive';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';

@Component({
  selector: 'tg-navigation-user-dropdown',
  templateUrl: './navigation-user-dropdown.component.html',
  styleUrls: ['./navigation-user-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiDataListModule,
    AutoFocusDirective,
    UserAvatarComponent,
    RouterLink,
  ],
})
export class NavigationUserDropdownComponent {
  @Input()
  public user!: User;

  @Output()
  public requestClose = new EventEmitter();
}
