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
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  TuiLinkComponent,
  TuiHostedDropdownModule,
  TuiLinkModule,
  TuiButtonModule,
} from '@taiga-ui/core';
import { Invitation } from '@taiga/data';
import { A11yModule } from '@angular/cdk/a11y';
import { TuiDropdownModule } from '@taiga-ui/core/directives/dropdown';
import { TranslocoDirective } from '@ngneat/transloco';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tg-revoke-invitation',
  templateUrl: './revoke-invitation.component.html',
  styleUrls: ['./revoke-invitation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiHostedDropdownModule,
    TuiDropdownModule,
    TuiLinkModule,
    A11yModule,
    TuiButtonModule,
  ],
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
