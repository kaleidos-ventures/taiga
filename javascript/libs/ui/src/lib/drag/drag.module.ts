/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NgModule } from '@angular/core';
import { DragInProgressComponent } from './components/drag-in-progress.component';
import { DraggableDirective } from './directives/draggable.directive';
import { DropZoneDirective } from './directives/drop-zone.directive';
import { DragHandleDirective } from './directives/drag-handle.directive';
@NgModule({
  declarations: [
    DraggableDirective,
    DragInProgressComponent,
    DropZoneDirective,
    DragHandleDirective,
  ],
  exports: [
    DraggableDirective,
    DragInProgressComponent,
    DropZoneDirective,
    DragHandleDirective,
  ],
})
export class DragModule {}
