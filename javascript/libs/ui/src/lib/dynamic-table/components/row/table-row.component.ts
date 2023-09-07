/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'tg-ui-dtable-row',
  templateUrl: './table-row.component.html',
  styleUrls: ['table-row.component.css'],
  standalone: true,
})
export class TableRowComponent {
  @HostBinding('attr.role') public role = 'row';
}
