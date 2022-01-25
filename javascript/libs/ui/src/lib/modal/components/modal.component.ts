/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { DomPortal } from '@angular/cdk/portal';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  Output,
  EventEmitter,
  Optional,
  Inject,
  OnInit,
} from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import {
  FocusMonitor,
  ConfigurableFocusTrapFactory,
  ConfigurableFocusTrap,
} from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { ModalService } from '../services/modal.service';
import { ShortcutsService } from '@taiga/core';

/*
Usage example:
<tg-ui-modal
  [open]="open"
  (requestClose)="open = !open">
  <h1>Hi!</h1>
  <my-modal-component></my-modal-component>
</tg-ui-modal>
*/
@Component({
  selector: 'tg-ui-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnDestroy, AfterViewInit, OnInit {
  public open$ = new BehaviorSubject<boolean>(false);
  public subscription!: Subscription;
  public focusTrap?: ConfigurableFocusTrap;

  @Output()
  public requestClose = new EventEmitter<void>();

  @Input()
  public elementFocusWhenClosed?: HTMLElement;

  @Input()
  public set open(value: boolean) {
    this.open$.next(value);
  }

  public get open() {
    return this.open$.value;
  }

  @ViewChild('domPortalContent')
  public domPortalContent!: ElementRef<HTMLElement>;

  public domPortal!: DomPortal<HTMLElement>;

  public afterClosed = new Subject<void>();

  private elementFocusedBeforeDialogWasOpened?: HTMLElement;

  constructor(
    private modalService: ModalService,
    private shortcutsService: ShortcutsService,
    private focusTrapFactory: ConfigurableFocusTrapFactory,
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef,
    @Optional() @Inject(DOCUMENT) private document: Document
  ) {}

  public ngOnInit() {
    this.open$.subscribe((open) => {
      if (open) {
        this.shortcutsService.setScope('modal');
      } else {
        this.shortcutsService.resetScope();
      }
    });

    this.shortcutsService.task('modal.close').subscribe(() => {
      this.close();
    });
  }

  public ngAfterViewInit() {
    this.domPortal = new DomPortal(this.domPortalContent);

    this.subscription = this.open$.subscribe((open) => {
      if (open) {
        this.modalService.open(this.domPortal);
        requestAnimationFrame(() => this.trapFocus());
      } else {
        this.modalService.close();
        requestAnimationFrame(() => {
          this.restoreFocus();
          this.afterClosed.next();
        });
      }
    });
  }

  public close() {
    this.requestClose.next();
  }

  public ngOnDestroy() {
    if (this.open) {
      this.open = false;
    }

    this.subscription.unsubscribe();
  }

  private capturePreviouslyFocusedElement() {
    if (this.document) {
      this.elementFocusedBeforeDialogWasOpened =
        this.getActiveElement() as HTMLElement;
    }
  }

  private getActiveElement(): Element | null {
    const activeElement = this.document.activeElement;

    return (
      (activeElement?.shadowRoot?.activeElement as HTMLElement) || activeElement
    );
  }

  private trapFocus() {
    this.capturePreviouslyFocusedElement();

    this.focusTrap = this.focusTrapFactory.create(
      this.domPortalContent.nativeElement.querySelector(
        '.modal-wrapper'
      ) as HTMLElement
    );

    void this.focusTrap.focusInitialElementWhenReady();
  }

  private restoreFocus() {
    const previousElement = this.elementFocusWhenClosed
      ? this.elementFocusWhenClosed
      : this.elementFocusedBeforeDialogWasOpened;

    if (previousElement && typeof previousElement.focus === 'function') {
      const activeElement = this.getActiveElement();
      const element = this.elementRef.nativeElement as HTMLElement;

      if (
        !activeElement ||
        activeElement === this.document.body ||
        activeElement === element ||
        element.contains(activeElement)
      ) {
        if (this.focusMonitor) {
          this.focusMonitor.focusVia(previousElement, null);
        } else {
          previousElement.focus();
        }
      }
    }

    if (this.focusTrap) {
      this.focusTrap.destroy();
    }
  }
}
