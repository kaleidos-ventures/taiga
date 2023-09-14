/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { TuiSvgModule } from '@taiga-ui/core';
import { User } from '@taiga/data';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { NouserAvatarComponent } from '~/app/shared/nouser-avatar/nouser-avatar.component';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

@Component({
  selector: 'tg-user-card',
  standalone: true,
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.css'],
  imports: [
    CommonModule,
    UserAvatarComponent,
    NouserAvatarComponent,
    TuiSvgModule,
  ],
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

  constructor(private translocoService: TranslocoService) {}

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

  public setColor(color: number | undefined) {
    return color ? color : 0;
  }

  public stringHighlighted(textToHighlight: string, text: string) {
    const rgx = new RegExp(
      `^${UtilsService.normalizeText(textToHighlight)}`,
      'g'
    );

    const finalText: string[] = [];
    text.split(' ').forEach((part) => {
      if (UtilsService.normalizeText(part).match(rgx)) {
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
