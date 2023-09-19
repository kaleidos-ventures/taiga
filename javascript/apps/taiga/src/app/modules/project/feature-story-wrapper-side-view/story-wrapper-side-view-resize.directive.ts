/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  animationFrameScheduler,
  fromEvent,
  Subscription,
  throttleTime,
} from 'rxjs';

@UntilDestroy()
@Directive({
  selector: '[tgStoryWrapperSideViewResize]',
  standalone: true,
})
export class StoryWrapperSideViewDirective {
  @Output()
  public tgResizeStart = new EventEmitter<MouseEvent>();

  @Output()
  public tgResizeEnd = new EventEmitter<MouseEvent>();

  @Output()
  public tgResizeMove = new EventEmitter<MouseEvent>();

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    event.preventDefault();

    if (this.subscriptionMouseup) {
      this.subscriptionMouseup.unsubscribe();
    }

    this.disableEditorPointerEvents();
    this.tgResizeStart.emit(event);

    this.subscriptionMousemove = fromEvent(document.body, 'mousemove')
      .pipe(untilDestroyed(this), throttleTime(0, animationFrameScheduler))
      .subscribe((event: Event) => {
        this.tgResizeMove.emit(event as MouseEvent);
      });

    this.subscriptionMouseup = fromEvent(document.body, 'mouseup')
      .pipe(untilDestroyed(this))
      .subscribe((event: Event) => {
        if (this.subscriptionMousemove) {
          this.tgResizeEnd.emit(event as MouseEvent);
          this.subscriptionMousemove?.unsubscribe();
          this.subscriptionMousemove = undefined;
          this.enableEditorPointerEvents();
        }
      });
  }

  private subscriptionMousemove?: Subscription;
  private subscriptionMouseup?: Subscription;

  private disableEditorPointerEvents() {
    document.querySelectorAll('editor').forEach((it) => {
      (it as HTMLElement).style.pointerEvents = 'none';
    });
  }

  private enableEditorPointerEvents() {
    document.querySelectorAll('editor').forEach((it) => {
      (it as HTMLElement).style.pointerEvents = '';
    });
  }
}
