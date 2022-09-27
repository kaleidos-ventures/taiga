/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DragService } from '../services/drag.service';
import { DropZoneDirective } from './drop-zone.directive';

@UntilDestroy()
@Directive({
  selector: '[tgDraggable]',
})
export class DraggableDirective implements OnDestroy {
  @Input()
  public dragDisabled = false;

  @Input()
  public dragData: unknown;

  @HostBinding('class.draggable')
  public get draggable() {
    return !this.dragDisabled;
  }

  @Input()
  public set tgDraggable(id: unknown) {
    this.id = id;
  }

  @HostListener('mousedown.prevent', ['$event'])
  public dragStart(event: MouseEvent) {
    if (!this.dragDisabled && event.button === 0) {
      this.dragService.dragStart(this);
    }
  }

  public id!: unknown;

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
}
