/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './components/table/table.component';
import { TableCellComponent } from './components/cell/table-cell.component';
import { TableHeaderComponent } from './components/header/table-header.component';
import { TableRowComponent } from './components/row/table-row.component';

@NgModule({
  imports: [CommonModule],
  declarations: [
    TableComponent,
    TableCellComponent,
    TableHeaderComponent,
    TableRowComponent,
  ],
  exports: [
    TableComponent,
    TableCellComponent,
    TableHeaderComponent,
    TableRowComponent,
  ],
})
export class DynamicTableModule {}
