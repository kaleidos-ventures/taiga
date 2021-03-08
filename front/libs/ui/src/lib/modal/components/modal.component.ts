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
  HostListener} from '@angular/core';
import { ModalService } from '@taiga/ui/modal/services/modal.service';
import { BehaviorSubject, Subscription } from 'rxjs';

/*
Usage example:
<tg-ui-modal
  [open]="open"
  (closed)="open = !open">
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

  @Output()
  public requestClose = new EventEmitter<void>();

  @Input()
  public set open(value: boolean) {
    this.open$.next(value);
  }

  @ViewChild('domPortalContent')
  public domPortalContent!: ElementRef<HTMLElement>;

  public domPortal!: DomPortal<HTMLElement>;

  @HostListener('window:keydown', ['$event'])
  public onEsc(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.open$.value) {
      this.close();
    }
  }

  constructor(private modalService: ModalService) {}

  public ngAfterViewInit() {
    this.domPortal = new DomPortal(this.domPortalContent);

    this.subscription = this.open$.subscribe((open) => {
      if (open) {
        this.modalService.open(this.domPortal);
      } else {
        this.modalService.close();
      }
    });
  }

  public close() {
    this.requestClose.next();
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
