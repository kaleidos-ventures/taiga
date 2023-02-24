/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DragService } from '../services/drag.service';
import { DraggableDirective } from './draggable.directive';

@UntilDestroy()
@Directive({
  selector: '[tgDropZone]',
})
export class DropZoneDirective implements OnDestroy {
  @Input()
  public set tgDropZone(id: unknown) {
    this.id = id;
  }

  public id!: unknown;

  private candidates: DraggableDirective[] = [];

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(private dragService: DragService, private el: ElementRef) {
    this.dragService.addDropZone(this);
  }

  public removeCandidate(candidate: DraggableDirective) {
    this.candidates = this.candidates.filter((it) => {
      return it !== candidate;
    });
  }

  public addCandidate(candidate: DraggableDirective) {
    this.candidates.push(candidate);
  }

  public getCandidates() {
    return this.candidates;
  }

  public ngOnDestroy(): void {
    this.dragService.deleteDropZone(this);
  }
}
