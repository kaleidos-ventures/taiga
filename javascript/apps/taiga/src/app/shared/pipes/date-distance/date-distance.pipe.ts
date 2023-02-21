/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import {
  differenceInDays,
  differenceInSeconds,
  differenceInYears,
  format,
  formatDistanceToNowStrict,
  parseISO,
} from 'date-fns';

@Pipe({ name: 'dateDistance', standalone: true })
export class DateDistancePipe implements PipeTransform {
  constructor(private translocoService: TranslocoService) {}
  public transform(date: string) {
    const createdAt = parseISO(date);
    const secondsDistance = Math.abs(
      differenceInSeconds(createdAt, new Date())
    );
    const daysDistance = Math.abs(differenceInDays(createdAt, new Date()));
    const yearsDistance = Math.abs(differenceInYears(createdAt, new Date()));

    // Less than 60 sec -> now
    // between 60 sec and 6 days -> {relativeTime} ago
    // between 6 days and 1 year -> MONTH DAY
    // More than 1 year -> MONTH DAY YEAR

    if (!yearsDistance) {
      if (daysDistance > 6) {
        return format(createdAt, 'MMM d');
      } else {
        if (secondsDistance <= 60) {
          return this.translocoService.translate('story.now');
        }
        const distance = formatDistanceToNowStrict(createdAt);
        const agoString = this.translocoService.translate('story.ago');
        return `${distance} ${agoString}`;
      }
    } else {
      return format(createdAt, 'MMM d, yyyy');
    }
  }
}
