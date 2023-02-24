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
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ResizedEvent } from './resize.model';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[resized]',
})
export class ResizedDirective implements OnInit, OnDestroy {
  @Output()
  public resized;

  private observer: ResizeObserver;
  private oldRect?: DOMRectReadOnly;

  constructor(private element: ElementRef, private zone: NgZone) {
    this.resized = new EventEmitter<ResizedEvent>();
    this.observer = new ResizeObserver((entries) =>
      this.zone.run(() => this.observe(entries))
    );
  }

  public ngOnInit() {
    this.observer.observe(this.element.nativeElement as HTMLElement);
  }

  public ngOnDestroy() {
    this.observer.disconnect();
  }

  private observe(entries: ResizeObserverEntry[]) {
    const domSize = entries[0];

    this.resized.emit({
      newRect: domSize.contentRect,
      oldRect: this.oldRect,
    });

    this.oldRect = domSize.contentRect;
  }
}
