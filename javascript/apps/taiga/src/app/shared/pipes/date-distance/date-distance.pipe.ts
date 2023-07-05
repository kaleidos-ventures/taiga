/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateService } from '~/app/services/date.service';

@Pipe({ name: 'dateDistance', standalone: true })
export class DateDistancePipe implements PipeTransform {
  private dateService = inject(DateService);

  public transform(date: string) {
    return this.dateService.transformDateDistance(date);
  }
}
