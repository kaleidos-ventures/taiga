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
  HostListener,
  Output,
  ViewChild,
  EventEmitter,
  HostBinding,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Validators } from '@angular/forms';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { selectCurrentWorkflow } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';

@Component({
  selector: 'tg-kanban-create-status',
  templateUrl: './kanban-create-status.component.html',
  styleUrls: ['./kanban-create-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCreateStatusComponent {
  @ViewChild('createStatusButton')
  public createStatusButton?: ElementRef;

  @ViewChild('statusInput')
  public statusInput?: ElementRef;

  @Output()
  public navigateLeft = new EventEmitter();

  @HostBinding('class.open')
  public get formOpen() {
    return this.showAddForm;
  }

  @HostListener('keydown.esc.prevent') public esc() {
    this.cancelStatusCreate();
  }

  public workflow = this.store.selectSignal(selectCurrentWorkflow);
  public color = 0;
  public textColor = '';
  public showAddForm = false;
  public submitted = false;
  public columnSize = 292;
  public statusMaxLength = 30;

  public form = this.fb.group({
    status: [
      '',
      [
        Validators.required,
        Validators.maxLength(this.statusMaxLength),
        //avoid only white spaces
        Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      ],
    ],
  });

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    public fb: FormBuilder,
    private store: Store
  ) {
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.columnSize}px`
    );
  }

  public submit() {
    const workflow = this.workflow();
    this.form.markAllAsTouched();

    if (this.form.valid && workflow) {
      this.store.dispatch(
        KanbanActions.createStatus({
          status: {
            name: this.form.get('status')!.value!,
            color: this.color,
          },
          workflow: workflow.slug,
        })
      );
      this.reset();
    } else {
      this.submitted = true;
    }
  }

  public leaveForm(active: boolean) {
    if (!active) {
      this.submit();
      this.cancelStatusCreate();
    }
  }

  public cancelStatusCreate() {
    this.reset();
    requestAnimationFrame(() => {
      (this.createStatusButton?.nativeElement as HTMLElement)?.focus();
    });
  }

  public showForm() {
    this.form.reset();
    this.setStatusColor();
    this.showAddForm = true;
    requestAnimationFrame(() => {
      this.navigateLeft.emit();
      (this.statusInput?.nativeElement as HTMLElement)?.focus();
    });
  }

  public setStatusColor() {
    const workflow = this.workflow();
    if (workflow) {
      this.color = UtilsService.getNextStatusColor(
        workflow.statuses.map((it) => it.color)
      );
      this.textColor = `var(--color-${UtilsService.statusColor(this.color)})`;
    }
  }

  private reset() {
    this.submitted = false;
    this.form.reset();
    this.showAddForm = false;
  }
}
