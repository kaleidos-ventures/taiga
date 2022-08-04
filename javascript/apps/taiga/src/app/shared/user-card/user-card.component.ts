/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { User } from '@taiga/data';
import { InvitationService } from '~/app/services/invitation.service';

@Component({
  selector: 'tg-user-card',
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css'],
})
export class UserCardComponent implements OnChanges {
  @Input() public user!: Partial<User>;
  @Input() public textToHighlight?: string;
  @Input() public active?: boolean;
  @Input() public disabled?: boolean;
  @Input() public isSelf?: boolean;
  @Input() public navigateToUser?: boolean;

  public fullNameHighlight?: string;
  public usernameHighlight?: string;

  public fullName?: string;

  constructor(
    private invitationService: InvitationService,
    private translocoService: TranslocoService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.user || changes.isSelf) {
      if (this.isSelf && this.user.fullName) {
        this.fullName = this.translocoService.translate('commons.your_user', {
          name: this.user.fullName,
        });
      } else {
        this.fullName = this.user.fullName;
      }
    }

    if (this.textToHighlight) {
      if (this.fullName) {
        this.fullNameHighlight = this.stringHighlighted(
          this.textToHighlight,
          this.fullName
        );
      } else {
        this.fullNameHighlight = '';
      }

      if (this.user.username) {
        const usernameText = this.stringHighlighted(
          this.textToHighlight,
          this.user.username
        );
        this.usernameHighlight = usernameText;
      } else {
        this.usernameHighlight = '';
      }
    }
  }

  public stringHighlighted(textToHighlight: string, text: string) {
    const rgx = new RegExp(
      `^${this.invitationService.normalizeText(textToHighlight)}`,
      'g'
    );

    const finalText: string[] = [];
    text.split(' ').forEach((part) => {
      if (this.invitationService.normalizeText(part).match(rgx)) {
        finalText.push(
          `<span class="strong">${part.substring(
            0,
            textToHighlight.length
          )}</span>${part.substring(textToHighlight.length, part.length)}`
        );
      } else {
        finalText.push(part);
      }
    });

    return finalText.join(' ');
  }
}
