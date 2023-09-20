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
import { Status, Workflow } from '@taiga/data';

import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { InputsModule } from '@taiga/ui/inputs';
import { ModalComponent } from '@taiga/ui/modal/components';
import { trackByProp } from '~/app/shared/utils/track-by-prop';

@Component({
  selector: 'tg-delete-workflow',
  templateUrl: './delete-workflow.component.html',
  styleUrls: ['./delete-workflow.component.css'],
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
export class DeleteWorkflowComponent implements OnInit {
  @Input({ required: true })
  public currentWorkflow!: Workflow;

  @Input()
  public show = false;

  @Output()
  public closeModal = new EventEmitter<void>();

  @Output()
  public submitDelete = new EventEmitter<Workflow['id'] | undefined>();

  @Input({ required: true })
  public set workflows(workflows: Workflow[]) {
    this.workflowsList.set(workflows);
  }

  public get isLastWorkflow() {
    return this.workflowsList().length === 1;
  }

  public form!: FormGroup;
  public fb = inject(FormBuilder);
  public workflowsList: WritableSignal<Workflow[]> = signal([]);
  public filteredWorkflwos: Signal<Workflow[]> = computed(() => {
    return this.workflowsList().filter(
      (it) => it.id !== this.currentWorkflow.id
    );
  });
  public valueContent!: Signal<string>;
  public trackById = trackByProp<Workflow>('id');

  public get statusesFormControl() {
    return this.form.get('statuses') as FormControl;
  }

  constructor() {
    if (!this.isLastWorkflow) {
      this.form = this.fb.group({
        statuses: ['move'],
        workflow: [''],
      });

      const valueContent$ = this.form.get('statuses')?.valueChanges.pipe(
        map((value) => {
          return this.workflowsList().find((it) => it.id === value)?.name ?? '';
        })
      ) as Observable<string>;

      this.valueContent = toSignal(valueContent$, {
        initialValue: '',
      });
    }
  }

  public ngOnInit() {
    if (this.filteredWorkflwos().length) {
      (this.form.get('workflow') as FormControl).setValue(
        this.filteredWorkflwos()[0].id
      );
    }
  }

  public submit() {
    this.close();
    const moveToWorkflow: Workflow['id'] | undefined =
      !this.isLastWorkflow && this.form.get('statuses')!.value === 'move'
        ? (this.form.get('workflow')!.value as Workflow['id'])
        : undefined;
    this.submitDelete.next(moveToWorkflow);
  }

  public close() {
    this.closeModal.next();
  }
}
