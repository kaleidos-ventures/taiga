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
  OnDestroy,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { Router } from '@angular/router';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[withInternalLink]' })
export class InternalLinkDirective implements AfterViewInit, OnDestroy {
  public observer!: MutationObserver;

  public get htmlElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    public renderer: Renderer2,
    public viewContainerRef: ViewContainerRef,
    private router: Router
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
    this.htmlElement.querySelectorAll('a').forEach((link) => {
      if (!link.target && !link.classList.contains('transloco-link')) {
        link.classList.add('transloco-link');
        const href = link.getAttribute('href');

        if (href) {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            void this.router.navigateByUrl(href);
          });
        }
      }
    });
  }

  public ngOnDestroy() {
    this.observer.disconnect();
  }
}
