/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';
import { TuiButtonComponent } from '@taiga-ui/core';
import { ButtonLoadingService } from './button-loading.service';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: 'button[loading]' })
export class ButtonLoadingDirective implements AfterViewInit {
  @Input()
  public loadingSuccess = '';

  @Input()
  public loadingMsg = '';

  @HostBinding('class') public get class() {
    if (this.currentState === 'inProgress') {
      return 'loading-in-progress';
    } else if (this.currentState === 'done') {
      return 'loading-done';
    }

    return '';
  }

  public currentState: 'default' | 'inProgress' | 'done' = 'default';

  private buttonText = '';
  private iconRight: typeof this.tuiButtonComponent.iconRight = '';
  private nextTimeout?: ReturnType<typeof setTimeout>;
  private dotsInterval?: ReturnType<typeof setTimeout>;
  private backgroundHtmlElement!: HTMLElement;

  constructor(
    private buttonLoadingService: ButtonLoadingService,
    private el: ElementRef,
    private tuiButtonComponent: TuiButtonComponent,
    private cd: ChangeDetectorRef
  ) {
    this.buttonLoadingService.register(this);
  }

  public ngAfterViewInit(): void {
    this.backgroundHtmlElement = this.element().querySelector('tui-wrapper')!;
  }

  public doneState() {
    if (this.currentState === 'inProgress') {
      this.stopLoading();

      this.backgroundHtmlElement.style.backgroundSize = '100%, 100%';

      this.tuiButtonComponent.iconRight = 'check';
      this.setContentText(this.loadingSuccess);

      this.currentState = 'done';
      this.cd.markForCheck();
    }
  }

  public defaultState() {
    this.enable();
    this.stopLoading();

    if (this.currentState !== 'default') {
      this.currentState = 'default';
      this.restoreButtonContent();

      this.element().removeAttribute('style');
      this.backgroundHtmlElement.removeAttribute('style');

      this.cd.markForCheck();
    }
  }

  public inProgressState() {
    this.storeButtonContent();
    this.fixWidth();

    this.currentState = 'inProgress';
    this.tuiButtonComponent.iconRight = '';
    this.disable();

    this.initDots();

    const bgColor = getComputedStyle(document.documentElement).getPropertyValue(
      '--color-primary20'
    );

    this.backgroundHtmlElement.style.backgroundRepeat = 'no-repeat, no-repeat';
    this.backgroundHtmlElement.style.backgroundImage = `linear-gradient(transparent 0%, ${bgColor} 0%)`;
    this.backgroundHtmlElement.style.backgroundSize = '0%, 100%';

    let currentProgress = 0;
    let step = this.randomIntFromInterval(5, 30) / 100;

    const nextStep = () => {
      currentProgress += step;
      const progress = Math.round(
        Math.round((Math.atan(currentProgress) / (Math.PI / 2)) * 100 * 1000) /
          1000
      );

      if (progress >= 85) {
        step = 0.1;
      } else {
        step = this.randomIntFromInterval(15, 30) / 100;
      }

      if (progress >= 100) {
        return;
      }

      this.backgroundHtmlElement.style.backgroundSize = `${progress}%, 100%`;

      this.nextTimeout = setTimeout(
        nextStep,
        this.randomIntFromInterval(100, 400)
      );
    };

    this.nextTimeout = setTimeout(
      nextStep,
      this.randomIntFromInterval(100, 400)
    );

    this.cd.markForCheck();
  }

  public disable() {
    this.element().setAttribute('disabled', 'disabled');
    this.element().setAttribute('aria-disabled', 'true');
  }

  public enable() {
    this.element().removeAttribute('disabled');
    this.element().removeAttribute('aria-disabled');
  }

  private initDots() {
    let dots = '.';
    this.setContentText(`${this.loadingMsg} ${dots}`);

    this.dotsInterval = setInterval(() => {
      dots.length === 3 ? (dots = '.') : (dots += '.');

      this.setContentText(`${this.loadingMsg} ${dots}`);
    }, 1000);
  }

  private stopLoading() {
    if (this.nextTimeout) {
      clearTimeout(this.nextTimeout);
      this.nextTimeout = undefined;
    }

    if (this.dotsInterval) {
      clearInterval(this.dotsInterval);
    }
  }

  private fixWidth() {
    const width = this.element().offsetWidth;

    this.element().style.width = `${width}px`;
  }

  private storeButtonContent() {
    this.buttonText = this.contentTextElement()?.textContent ?? '';
    this.iconRight = this.tuiButtonComponent.iconRight;
  }

  private setContentText(msg = '') {
    const elm = this.contentTextElement();

    if (elm) {
      const textNode = Array.from(elm.childNodes).find(
        (it) => it.nodeType === Node.TEXT_NODE
      );

      if (textNode) {
        textNode.nodeValue = msg;
      }
    }
  }

  private restoreButtonContent() {
    this.setContentText(this.buttonText);
    this.tuiButtonComponent.iconRight = this.iconRight;
  }

  private element() {
    return this.el.nativeElement as HTMLElement;
  }

  private contentTextElement(): HTMLElement | null {
    return this.element().querySelector('.t-content');
  }

  private randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
