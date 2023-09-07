/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { TranslocoService } from '@ngneat/transloco';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';

@Component({
  selector: 'tg-undo',
  standalone: true,
  imports: [
    CommonModule,
    TuiLinkModule,
    TuiButtonModule,
    ContextNotificationComponent,
  ],
  templateUrl: './undo.component.html',
  styleUrls: ['./undo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('undoDone', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(100%)',
        }),
        animate(
          '400ms 1s ease-out',
          style({
            opacity: 1,
            transform: 'translateX(0%)',
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '400ms ease-out',
          style({
            opacity: 0,
            transform: 'translateX(100%)',
          })
        ),
      ]),
    ]),
    trigger('showUndo', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(100%)',
        }),
        animate(
          '400ms 0.5s ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0%)',
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '400ms ease-out',
          style({
            opacity: 0,
            transform: 'translateX(0%)',
          })
        ),
      ]),
    ]),
    trigger('undoSteps', [
      state(
        'none',
        style({
          opacity: 1,
          transform: 'translateY(0%)',
        })
      ),
      state(
        'undone',
        style({
          opacity: 1,
          transform: 'translateY(0%)',
        })
      ),
      state(
        'waitUndo',
        style({
          opacity: 0,
          transform: 'translateY(-100%)',
        })
      ),
      transition('none => waitUndo', [
        style({ opacity: 0.7 }),
        animate('0.3s 0.5s'),
      ]),
      transition('waitUndo => undone', [
        style({ opacity: 1 }),
        animate('0.3s'),
      ]),
      transition('waitUndo => none', [animate('0.3s')]),
    ]),
  ],
})
export class UndoComponent implements OnInit, OnDestroy {
  private t = inject(TranslocoService);
  private takeUntilDestroyed = takeUntilDestroyed();

  @Input({ required: true })
  public initUndo!: Observable<void>;

  @Input({ required: true })
  public msg!: string;

  @Input()
  public msgActionUndon = this.t.translate('ui_components.undo.action_undone');

  @Input()
  public msgActionUndo = this.t.translate('ui_components.undo.action_undo');

  @Input()
  public undoTimeout = 10000;

  @Output()
  public confirm = new EventEmitter<void>();

  @HostListener('window:beforeunload')
  public beforeUnload() {
    if (this.state() === 'waitUndo') {
      this.confirm.next();
    }
  }

  public state = signal('none');
  public el = inject<ElementRef<HTMLElement>>(ElementRef);
  public confirmTimeout: ReturnType<typeof setTimeout> | null = null;
  public undoneTimeout: ReturnType<typeof setTimeout> | null = null;

  public undo() {
    this.clearConfirmTimeout();

    this.state.set('undone');

    this.undoneTimeout = setTimeout(() => {
      this.close();
    }, 4000);
  }

  public ngOnInit() {
    this.initUndo.pipe(this.takeUntilDestroyed).subscribe(() => {
      this.el.nativeElement.style.setProperty(
        '--row-height',
        `${this.el.nativeElement.offsetHeight}px`
      );

      this.state.set('waitUndo');

      this.confirmTimeout = setTimeout(() => {
        this.runConfirmDelete();
      }, this.undoTimeout);
    });
  }

  public closeConfirm() {
    this.runConfirmDelete();
  }

  public close() {
    this.state.set('none');
  }

  public ngOnDestroy() {
    if (this.undoneTimeout) {
      clearTimeout(this.undoneTimeout);
    }

    if (this.confirmTimeout) {
      this.runConfirmDelete();
    }
  }

  private runConfirmDelete() {
    this.close();
    this.confirm.next();
    this.clearConfirmTimeout();
  }

  private clearConfirmTimeout() {
    if (this.confirmTimeout) {
      clearTimeout(this.confirmTimeout);
      this.confirmTimeout = null;
    }
  }
}
