/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NgModule } from '@angular/core';
import { DragInProgressComponent } from './components/drag-in-progress.component';
import { DraggableDirective } from './directives/draggable.directive';
import { DropZoneDirective } from './directives/drop-zone.directive';
@NgModule({
  declarations: [
    DraggableDirective,
    DragInProgressComponent,
    DropZoneDirective,
  ],
  exports: [DraggableDirective, DragInProgressComponent, DropZoneDirective],
})
export class DragModule {}
