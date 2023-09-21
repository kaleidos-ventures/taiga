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
  WritableSignal,
  computed,
  Signal,
} from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import { TuiButtonModule, TuiLinkModule } from '@taiga-ui/core';
import { Workflow } from '@taiga/data';

import { FormControl, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ContextNotificationComponent } from '@taiga/ui/context-notification/context-notification.component';
import { InputsModule } from '@taiga/ui/inputs';
import { ModalComponent } from '@taiga/ui/modal/components';
import { trackByProp } from '~/app/shared/utils/track-by-prop';

/* TODO: Workflout shoud have id?, if not, change the type */
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

  public form = new FormGroup({
    statuses: new FormControl<string>('move', { nonNullable: true }),
    workflow: new FormControl<string>('', { nonNullable: true }),
  });
  public workflowsList: WritableSignal<Workflow[]> = signal([]);
  public filteredWorkflows = computed(() => {
    return this.workflowsList().filter(
      (it) => it.slug !== this.currentWorkflow.slug
    );
  });
  public isLastWorkflow = computed(() => {
    return this.workflowsList().length === 1;
  });

  public valueContent!: Signal<string>;
  public trackById = trackByProp<Workflow>('id');

  public get statusesFormControl() {
    return this.form.get('statuses') as FormControl;
  }

  constructor() {
    if (!this.isLastWorkflow()) {
      this.valueContent = toSignal(
        this.statusesFormControl.valueChanges.pipe(
          takeUntilDestroyed(),
          map((value) => {
            return (
              this.workflowsList().find((it) => it.id === value)?.name ?? ''
            );
          }),
          map((value) => value ?? '')
        ),
        { initialValue: '' }
      );
    }
  }

  public ngOnInit() {
    if (this.filteredWorkflows().length) {
      this.form.get('workflow')?.setValue(this.filteredWorkflows()[0].slug);
    }
  }

  public submit() {
    this.close();
    const moveToWorkflow: Workflow['id'] | undefined =
      !this.isLastWorkflow() && this.form.get('statuses')!.value === 'move'
        ? this.form.value.workflow
        : undefined;
    this.submitDelete.next(moveToWorkflow);
  }

  public close() {
    this.closeModal.next();
  }
}
