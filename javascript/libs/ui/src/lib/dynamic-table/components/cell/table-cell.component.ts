/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'tg-ui-dtable-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['table-cell.component.css'],
})
export class TableCellComponent {
  @HostBinding('attr.role') public role = 'cell';
}
