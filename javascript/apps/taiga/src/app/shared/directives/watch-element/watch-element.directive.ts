/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { WatchElementService } from './watch-element.service';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[watchElement]',
  standalone: true,
})
export class WatchElementDirective implements OnInit, OnDestroy {
  @Input()
  public watchElement!: string;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private watchElementService: WatchElementService
  ) {}

  public ngOnInit(): void {
    this.watchElementService.add(this.watchElement, this.nativeElement);
  }

  public ngOnDestroy(): void {
    this.watchElementService.remove(this.watchElement);
  }
}
