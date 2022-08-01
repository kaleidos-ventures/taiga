/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterContentInit, Directive, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Directive({
  standalone: true,
  selector: '[tgTitle]',
})
export class TitleDirective implements AfterContentInit {
  constructor(private el: ElementRef, private titleService: Title) {}

  public ngAfterContentInit() {
    this.titleService.setTitle(
      (this.el.nativeElement as HTMLElement).innerHTML
    );
  }
}
