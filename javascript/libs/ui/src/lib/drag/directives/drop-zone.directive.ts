/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { DragService } from '../services/drag.service';
import { Draggable, DropZone } from '../drag.model';

@Directive({
  selector: '[tgUiDropZone]',
})
export class DropZoneDirective implements OnDestroy, DropZone {
  @Input()
  public dropCategory?: string;

  @Input()
  public overlapStrategy: DropZone['overlapStrategy'] = 'all';

  @Input()
  public set tgUiDropZone(id: unknown) {
    this.id = id;
  }

  public id!: unknown;

  private candidates: Draggable[] = [];

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(private dragService: DragService, private el: ElementRef) {
    this.dragService.addDropZone(this);
  }

  public removeCandidate(candidate: Draggable) {
    this.candidates = this.candidates.filter((it) => {
      return it !== candidate;
    });
  }

  public addCandidate(candidate: Draggable) {
    this.candidates.push(candidate);
  }

  public getCandidates() {
    return this.candidates;
  }

  public ngOnDestroy(): void {
    this.dragService.deleteDropZone(this);
  }
}
