/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, HostListener, inject } from '@angular/core';
import { DraggableDirective } from './draggable.directive';

@Directive({
  selector: '[tgUiDragHandle]',
  standalone: true,
})
export class DragHandleDirective {
  @HostListener('mousedown.prevent', ['$event'])
  public dragStart(event: MouseEvent) {
    if (this.draggable && event.button === 0) {
      event.stopPropagation();
      this.draggable.dragByHandle();
    }
  }

  private draggable = inject(DraggableDirective, {
    optional: true,
  });

  constructor() {
    this.draggable?.registerDragHandle(this);
  }
}
