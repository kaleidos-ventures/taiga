/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Pipe, PipeTransform } from '@angular/core';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  public transform(colorNumber: number, type = 60) {
    return `var(--color-${UtilsService.statusColor(colorNumber, type)})`;
  }
}
