/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'tg-ui-dtable-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['table-header.component.css'],
})
export class TableHeaderComponent {
  @HostBinding('attr.role') public role = 'columnheader';
  @HostBinding('attr.aria-sort') public ariaSort = 'none';
}
