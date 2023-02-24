/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';

import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[withExternalLink]' })
export class ExternalLinkDirective implements AfterViewInit, OnDestroy {
  public observer!: MutationObserver;

  public get htmlElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    public renderer: Renderer2,
    private cd: ChangeDetectorRef,
    private translocoService: TranslocoService,
    public viewContainerRef: ViewContainerRef
  ) {}

  public ngAfterViewInit(): void {
    this.processLinks();

    this.observer = new MutationObserver(() => {
      this.processLinks();
    });

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'target'],
    };

    this.observer.observe(this.htmlElement, config);
  }

  public processLinks() {
    const text: string = this.translocoService.translate('navigation.new_tab');
    this.htmlElement.querySelectorAll('a[target="_blank"]').forEach((link) => {
      const size = getComputedStyle(link).fontSize;
      const svg = document.createElement('svg');
      const wrapper = document.createElement('div');
      wrapper.classList.add('external-svg');

      link.classList.add('external-link');
      svg.style.blockSize = size;
      svg.style.inlineSize = size;
      svg.setAttribute('aria-label', text);
      svg.setAttribute('version', '1.1');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      svg.setAttribute('focusable', 'false');

      const use = document.createElement('use');
      svg.appendChild(use);

      use.setAttribute('xlink:href', '/assets/icons/sprite.svg#external-link');
      wrapper.innerHTML = svg.outerHTML;

      link.appendChild(wrapper);
      this.cd.markForCheck();
    });
  }

  public ngOnDestroy() {
    this.observer.disconnect();
  }
}
