/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TuiDialogService } from '@taiga-ui/core';
import { ShortcutsService } from '@taiga/core';
import { ModalService } from '@taiga/ui/modal/services/modal.service';
import { PolymorpheusContent } from '@tinkoff/ng-polymorpheus';
import { BehaviorSubject, Subscription } from 'rxjs';
import { pairwise, startWith } from 'rxjs/operators';
import { v4 } from 'uuid';

/*
Usage example:
<tg-ui-modal
  [open]="open"
  (requestClose)="open = !open">
  <h1>Hi!</h1>
  <my-modal-component *ngIf="open"></my-modal-component>
</tg-ui-modal>
*/
@UntilDestroy()
@Component({
  selector: 'tg-ui-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  public open$ = new BehaviorSubject<boolean>(false);

  @Output()
  public requestClose = new EventEmitter<void>();

  @Output()
  public closed = new EventEmitter<void>();

  @Input()
  public elementFocusWhenClosed?: HTMLElement;

  @Input()
  public heightAuto = false;

  @Input()
  public closeButton = true;

  @Input()
  public noPadding = false;

  @Input()
  public big = false;

  @Input()
  public width = 715;

  @Input()
  public closeClickOutside = false;

  @Input()
  public set open(value: boolean) {
    this.open$.next(value);
  }

  public get open() {
    return this.open$.value;
  }

  @ViewChild('domPortalContent')
  public domPortalContent!: PolymorpheusContent<HTMLElement>;

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: Event) {
    if (this.closeClickOutside) {
      const target = event.target as HTMLElement;
      const overlay =
        document.querySelector('tui-dialog-host')?.children[0] === target;
      const modalInner = target.dataset.ref?.includes('modal-inner');
      if (overlay || modalInner) {
        this.closeTopModal();
      }
    }
  }

  public modalSubscription$?: Subscription;
  public id = v4();

  constructor(
    public modalService: ModalService,
    public dialogService: TuiDialogService,
    public shortcutsService: ShortcutsService,
    public el: ElementRef
  ) {}

  public ngAfterViewInit() {
    this.open$
      .pipe(startWith(false), untilDestroyed(this), pairwise())
      .subscribe(([oldOpen, open]) => {
        if (open) {
          this.processOpen();
        } else if (oldOpen) {
          this.processClose();
        }
      });

    this.shortcutsService
      .task('cancel', {}, `modal-${this.id}`)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.closeTopModal();
      });
  }

  public closeTopModal() {
    const topModal = Array.from(
      document.querySelectorAll('tg-ui-modal-wrapper')
    ).pop();

    const modal = document.getElementById(this.id);

    // closes the last open modal
    if (modal && topModal && topModal.contains(modal)) {
      this.close();
    }
  }

  public close() {
    this.requestClose.next();
  }

  public ngOnDestroy(): void {
    if (this.open) {
      this.processClose();
    }
  }

  private processOpen() {
    this.modalService
      .open(this.domPortalContent, {})
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.closed.next();
        },
      });

    this.shortcutsService.setScope(`modal-${this.id}`);
  }

  private processClose() {
    this.modalService.getContext().completeWith(null);
    this.shortcutsService.undoScope(`modal-${this.id}`);
  }
}
