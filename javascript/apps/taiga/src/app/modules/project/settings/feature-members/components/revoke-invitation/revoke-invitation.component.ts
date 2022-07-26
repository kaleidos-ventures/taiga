/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TuiLinkComponent } from '@taiga-ui/core';
import { Invitation } from '@taiga/data';

@Component({
  selector: 'tg-revoke-invitation',
  templateUrl: './revoke-invitation.component.html',
  styleUrls: ['./revoke-invitation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevokeInvitationComponent {
  @ViewChild('cancel')
  public cancelButton!: TuiLinkComponent;

  @Input() public invitation!: Invitation;

  @Output() public opened = new EventEmitter();
  @Output() public closed = new EventEmitter();
  @Output() public confirmed = new EventEmitter();

  public revokeInvitationTimeOut: ReturnType<typeof setTimeout> | null = null;

  private open = false;

  public get dropdownState() {
    return this.open;
  }

  public set dropdownState(open: boolean) {
    this.open = open;

    if (this.open) {
      this.opened.emit();
    } else {
      this.closed.emit();
    }
  }

  public keep() {
    this.dropdownState = false;
    this.cancelButton.nativeFocusableElement.focus();
  }

  public confirm() {
    this.confirmed.emit();
    this.dropdownState = false;
  }
}
