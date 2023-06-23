/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
} from '@angular/core';
import { DragService } from '../services/drag.service';
import { DropZoneDirective } from './drop-zone.directive';
import { Draggable } from '../drag.model';
import { DragHandleDirective } from './drag-handle.directive';

@Directive({
  selector: '[tgUiDraggable]',
})
export class DraggableDirective implements OnDestroy, Draggable {
  @Input()
  public dragDisabled = false;

  @Input()
  public dragData: unknown;

  @Input()
  public dropCategory?: string;

  @HostBinding('class.draggable')
  public get draggable() {
    return !this.dragDisabled;
  }

  @Input()
  public set tgUiDraggable(id: unknown) {
    this.id = id;
  }

  @HostListener('mousedown', ['$event'])
  public dragStart(event: MouseEvent) {
    if (!this.dragHandle && !this.dragDisabled && event.button === 0) {
      event.preventDefault();
      this.dragService.dragStart(this);
    }
  }

  public id!: unknown;

  private dragHandle?: DragHandleDirective;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private dragService: DragService,
    public dropZone: DropZoneDirective
  ) {
    this.dropZone.addCandidate(this);
  }

  public ngOnDestroy(): void {
    this.dropZone.removeCandidate(this);
  }

  public dragByHandle() {
    if (!this.dragDisabled) {
      this.dragService.dragStart(this);
    }
  }

  public registerDragHandle(dragHandle: DragHandleDirective) {
    this.dragHandle = dragHandle;
  }
}
