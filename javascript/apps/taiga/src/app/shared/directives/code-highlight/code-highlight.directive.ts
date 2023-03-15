/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { AfterViewChecked, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[tgCodeHightlight]',
  standalone: true,
})
export class CodeHightlightDirective implements AfterViewChecked {
  public get nativeElement() {
    return this.elementRef.nativeElement as HTMLElement;
  }

  constructor(private elementRef: ElementRef) {}

  public async ngAfterViewChecked() {
    this.loadIfNot('assets/editor/prism.css');

    /* eslint-disable */
    if (!(window as any).Prism) {
      await import('apps/taiga/src/assets/editor/prism.js' as any);
    }

    (window as any).Prism.highlightAllUnder(this.nativeElement);
    /* eslint-enable */
  }

  private loadIfNot(url: string) {
    const cssId = 'prism-css';
    if (!document.getElementById(cssId)) {
      const head = document.getElementsByTagName('head')[0];
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.media = 'all';
      head.appendChild(link);
    }
  }
}
