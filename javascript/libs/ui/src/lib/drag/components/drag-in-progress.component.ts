/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, ElementRef } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DragService } from '../services/drag.service';
import { filter } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'tg-ui-drag-in-progress',
  templateUrl: './drag-in-progress.component.html',
  styleUrls: ['./drag-in-progress.component.css'],
  standalone: true,
})
export class DragInProgressComponent {
  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(private el: ElementRef, private dragService: DragService) {
    this.dragService.setDragInProgress(this);

    this.dragService
      .position()
      .pipe(
        untilDestroyed(this),
        filter(
          <T>(value: T): value is NonNullable<T> =>
            value !== undefined && value !== null
        )
      )
      .subscribe((position) => {
        this.nativeElement.style.transform = `translate(${position.x}px, ${position.y}px)`;
        this.nativeElement.style.width = `${this.dragService.dragElementWidth}px`;

        requestAnimationFrame(() => {
          this.dragService.newDragPosition(
            this.nativeElement.getBoundingClientRect()
          );
        });
      });
  }
}
