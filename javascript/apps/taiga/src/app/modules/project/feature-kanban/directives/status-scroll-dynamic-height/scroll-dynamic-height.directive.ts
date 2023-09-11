/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';

export interface StatusScrollDynamicHeight {
  cdkScrollable?: CdkVirtualScrollViewport;
}

@Directive({
  selector: '[tgScrollDynamicHeight]',
  exportAs: 'tgScrollDynamicHeight',
  standalone: true,
})
export class StatusScrollDynamicHeightDirective
  implements AfterViewInit, OnDestroy
{
  @Input()
  public cdkScrollable!: CdkVirtualScrollViewport;

  @Input()
  public tgScrollDynamicHeight!: unknown[];

  @Output()
  public dynamicHeightChanged = new EventEmitter<number>();

  @HostListener('window:resize')
  public onResize() {
    requestAnimationFrame(() => {
      this.calculateHeight();
    });
  }

  private siblings: HTMLElement[] = [];
  private observer = new MutationObserver(() => {
    this.calculateHeight();
  });
  private currentBlockSize = 0;
  private _virtualScrollViewPort: HTMLElement | null = null;
  private lastBlockSize: null | number = null;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  public get scrollContentWrapper() {
    return this.nativeElement.querySelector<HTMLElement>(
      '.cdk-virtual-scroll-content-wrapper'
    );
  }

  private get virtualScrollViewPort() {
    if (!this._virtualScrollViewPort) {
      this._virtualScrollViewPort =
        this.nativeElement.querySelector<HTMLElement>(
          'cdk-virtual-scroll-viewport'
        );
    }

    return this._virtualScrollViewPort;
  }

  constructor(private el: ElementRef) {}

  public calculateHeight() {
    const maxHeight = this.getMaxHeight();

    let blockSize = 0;

    const stories = Array.from(
      this.nativeElement.querySelectorAll<HTMLElement>('tg-kanban-story')
    );

    blockSize = stories.reduce((prev, el) => {
      return prev + this.getElementFullSize(el);
    }, 0);

    if (maxHeight && blockSize > maxHeight) {
      blockSize = maxHeight;
    }

    // the content is ready but not rendered
    if (this.tgScrollDynamicHeight.length && !blockSize) {
      blockSize = maxHeight;
    }

    this.setBlockSize(blockSize);
  }

  public getSiblings() {
    const parent = this.nativeElement.parentElement;

    if (parent) {
      return Array.from(parent.childNodes).filter((el) => {
        return el !== this.nativeElement && el.nodeType === Node.ELEMENT_NODE;
      }) as HTMLElement[];
    }

    return [];
  }

  public getElementFullSize(el: HTMLElement) {
    return el.getBoundingClientRect().height + this.getElementMargins(el);
  }

  public getElementMargins(el: HTMLElement) {
    const start = Number(
      getComputedStyle(el).marginBlockStart.replace('px', '')
    );
    const end = Number(getComputedStyle(el).marginBlockEnd.replace('px', ''));

    return start + end;
  }

  public ngAfterViewInit(): void {
    this.initialHeight();
    this.contentHeight();
  }

  public ngOnDestroy(): void {
    this.observer.disconnect();
  }

  private initialHeight() {
    const maxHeight = this.getMaxHeight();
    this.setBlockSize(maxHeight);
  }

  private contentHeight() {
    this.observer.observe(this.nativeElement.parentElement as HTMLElement, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private setBlockSize(blockSize: number) {
    if (this.virtualScrollViewPort) {
      if (Math.round(this.currentBlockSize) !== Math.round(blockSize)) {
        this.currentBlockSize = blockSize;
        this.virtualScrollViewPort.style.blockSize = `${blockSize}px`;
      }
    }

    if (this.lastBlockSize !== blockSize) {
      this.dynamicHeightChanged.emit(blockSize);
      this.lastBlockSize = blockSize;
    }
  }

  private getMaxHeight() {
    this.siblings = this.getSiblings();

    const siblingsSize = this.siblings.reduce((prev, el) => {
      return prev + this.getElementFullSize(el);
    }, 0);

    const statusBorder =
      Number(
        getComputedStyle(
          this.nativeElement.closest('tg-kanban-status')!
        ).borderWidth.replace('px', '')
      ) * 2;

    const columnHeight =
      this.nativeElement.closest('tg-kanban-workflow')?.getBoundingClientRect()
        .height ?? 0;

    return (
      columnHeight -
      siblingsSize -
      statusBorder -
      this.getElementMargins(this.nativeElement)
    );
  }
}
