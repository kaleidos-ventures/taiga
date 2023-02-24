/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TableComponent } from './table.component';
import { TuiTableModule } from '@taiga-ui/addon-table';

@NgModule({
  imports: [CommonModule, TuiTableModule],
  declarations: [TableComponent],
  providers: [],
  exports: [TableComponent],
})
export class TableModule {}
