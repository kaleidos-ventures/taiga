/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { skip } from 'rxjs/operators';
@UntilDestroy()
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[inViewport]',
})
export class inViewportDirective implements OnInit, AfterViewInit, OnDestroy {
  @Input() public threshold = 1;
  @Output() public visible = new EventEmitter<HTMLElement>();
  @Input() public skip = 0;

  private observer: IntersectionObserver | undefined;
  private subject$: Subject<{
    entry: IntersectionObserverEntry;
    observer: IntersectionObserver;
  }> = new Subject();

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    this.createObserver();
  }

  public ngAfterViewInit() {
    this.startObservingElements();
  }

  public ngOnDestroy() {
    this.observer?.unobserve(this.element.nativeElement as HTMLElement);
  }

  private createObserver() {
    const options = {
      rootMargin: '0px',
      threshold: this.threshold,
    };

    const isIntersecting = (entry: IntersectionObserverEntry) =>
      entry.isIntersecting || entry.intersectionRatio > 0;

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (isIntersecting(entry)) {
          this.subject$.next({ entry, observer });
        }
      });
    }, options);
  }

  private startObservingElements() {
    if (!this.observer) {
      return;
    }

    this.observer.observe(this.element.nativeElement as HTMLElement);

    this.subject$
      .pipe(untilDestroyed(this), skip(this.skip))
      .subscribe(({ entry }) => {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          this.visible.emit(target);
        }
      });
  }
}
