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
  EventEmitter,
  Input,
  Output,
  OnInit,
  signal,
  inject,
  WritableSignal,
  computed,
  Signal,
} from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { Status } from '@taiga/data';

import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { InputsModule } from '@taiga/ui/inputs';
import { ModalComponent } from '@taiga/ui/modal/components';

@Component({
  selector: 'tg-delete-status',
  templateUrl: './delete-status.component.html',
  styleUrls: ['./delete-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    TuiAutoFocusModule,
    CommonModule,
    ContextNotificationComponent,
    InputsModule,
    ModalComponent,
  ],
})
export class DeleteStatusComponent implements OnInit {
  @Input({ required: true })
  public currentStatus!: Status;

  @Input({ required: true })
  public isLastStatus!: boolean;

  @Input()
  public show = false;

  @Output()
  public closeModal = new EventEmitter<void>();

  @Output()
  public submitDelete = new EventEmitter<Status['id'] | undefined>();

  @Input({ required: true })
  public set statuses(statuses: Status[]) {
    this.statusesList.set(statuses);
  }

  public form!: FormGroup;
  public fb = inject(FormBuilder);
  public statusesList: WritableSignal<Status[]> = signal([]);
  public filteredStatus: Signal<Status[]> = computed(() => {
    return this.statusesList().filter((it) => it.id !== this.currentStatus.id);
  });
  public valueContent!: Signal<string>;

  public get storiesFormControl() {
    return this.form.get('stories') as FormControl;
  }

  constructor() {
    if (!this.isLastStatus) {
      this.form = this.fb.group({
        stories: ['move'],
        status: [''],
      });

      const valueContent$ = this.form.get('status')?.valueChanges.pipe(
        takeUntilDestroyed(),
        map((value) => {
          return this.statusesList().find((it) => it.id === value)?.name ?? '';
        })
      ) as Observable<string>;

      this.valueContent = toSignal(valueContent$, {
        initialValue: '',
      });
    }
  }

  public ngOnInit() {
    if (this.filteredStatus().length) {
      (this.form.get('status') as FormControl).setValue(
        this.filteredStatus()[0].id
      );
    }
  }

  public trackById(_index: number, status: Status) {
    return status.id;
  }

  public submit() {
    this.close();
    const moveToStatus: Status['id'] | undefined =
      !this.isLastStatus && this.form.get('stories')!.value === 'move'
        ? (this.form.get('status')!.value as Status['id'])
        : undefined;
    this.submitDelete.next(moveToStatus);
  }

  public close() {
    this.closeModal.next();
  }
}
