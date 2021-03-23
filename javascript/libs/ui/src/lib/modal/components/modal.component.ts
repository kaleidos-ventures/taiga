/**
 * Copyright (c) 2014-2021 Taiga Agile LLC
 *
 * This source code is licensed under the terms of the
 * GNU Affero General Public License found in the LICENSE file in
 * the root directory of this source tree.
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
  HostListener,
  Optional,
  Inject
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FocusMonitor, ConfigurableFocusTrapFactory, ConfigurableFocusTrap } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import { ModalService } from '../services/modal.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnDestroy, AfterViewInit {
  public open$ = new BehaviorSubject<boolean>(false);
  public subscription!: Subscription;
  public focusTrap?: ConfigurableFocusTrap;

  @Output()
  public requestClose = new EventEmitter<void>();

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

  private elementFocusedBeforeDialogWasOpened?: HTMLElement;

  @HostListener('window:keydown', ['$event'])
  public onEsc(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.open$.value) {
      this.close();
    }
  }

  constructor(
    private modalService: ModalService,
    private focusTrapFactory:  ConfigurableFocusTrapFactory,
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef,
    @Optional() @Inject(DOCUMENT) private document: Document) {}

  public ngAfterViewInit() {
    this.domPortal = new DomPortal(this.domPortalContent);

    this.subscription = this.open$.subscribe((open) => {
      if (open) {
        this.modalService.open(this.domPortal);
        requestAnimationFrame(() => this.trapFocus());
      } else {
        this.modalService.close();
        requestAnimationFrame(() => this.restoreFocus());
      }
    });
  }

  public close() {
    this.requestClose.next();
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private capturePreviouslyFocusedElement() {
    if (this.document) {
      this.elementFocusedBeforeDialogWasOpened = this.getActiveElement() as HTMLElement;
    }
  }

  private getActiveElement(): Element | null {
    const activeElement = this.document.activeElement;

    return activeElement?.shadowRoot?.activeElement as HTMLElement || activeElement;
  }

  private trapFocus() {
    this.capturePreviouslyFocusedElement();

    this.focusTrap = this.focusTrapFactory.create(
      this.domPortalContent.nativeElement.querySelector('.modal-wrapper') as HTMLElement
    );

    void this.focusTrap.focusInitialElementWhenReady();
  }

  private restoreFocus() {
    const previousElement = this.elementFocusedBeforeDialogWasOpened;

    if (previousElement && typeof previousElement.focus === 'function') {
      const activeElement = this.getActiveElement();
      const element = this.elementRef.nativeElement as HTMLElement;

      if (!activeElement || activeElement === this.document.body || activeElement === element ||
          element.contains(activeElement)) {
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
