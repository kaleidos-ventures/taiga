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
      `(?<!<span class="strong">)${this.invitationService.normalizeText(
        textToHighlight
      )}`,
      'g'
    );
    let result;
    let finalText = text;

    while (
      (result = rgx.exec(this.invitationService.normalizeText(finalText))) !==
      null
    ) {
      const tempText = finalText.split('');
      tempText.splice(result?.index, 0, '<span class="strong">');
      tempText.splice(rgx.lastIndex + 1, 0, '</span>');
      finalText = tempText.join('');
    }

    return finalText;
  }
}
