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
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Status } from '@taiga/data';
import { selectCurrentWorkflow } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { EditStatus } from '~/app/modules/project/feature-kanban/models/edit-status.model';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

@Component({
  selector: 'tg-edit-status',
  templateUrl: './edit-status.component.html',
  styleUrls: ['./edit-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStatusComponent implements OnInit {
  @ViewChild('statusInput')
  public statusInput?: ElementRef;

  @Input() public status: Status | null = null;
  @Input() public action: 'edition' | 'creation' = 'edition';

  // Emits a new status new
  @Output()
  public setStatus = new EventEmitter<EditStatus>();

  // Form is closed programmatically
  @Output()
  public leave = new EventEmitter<EditStatus>();

  // User cancels the form edition
  @Output()
  public cancel = new EventEmitter<void>();

  @HostListener('keydown.esc.prevent') public esc() {
    this.cancelEdit();
  }

  public workflow = this.store.selectSignal(selectCurrentWorkflow);

  public statusForm!: FormGroup;
  public statusMaxLength = 30;
  public color = 0;
  public textColor = '';
  public columnSize = 292;
  public submitted = false;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private store: Store
  ) {
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.columnSize}px`
    );
  }

  public ngOnInit() {
    this.initStatusColor();
    this.initForm();
  }

  public initStatusColor() {
    if (this.status) {
      this.color = this.status.color;
    } else {
      const workflow = this.workflow();
      if (workflow) {
        this.color = UtilsService.getNextStatusColor(
          workflow.statuses.map((it) => it.color)
        );
      }
    }
    this.textColor = `var(--color-${UtilsService.statusColor(this.color)})`;
  }

  public initForm() {
    this.statusForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(this.statusMaxLength),
          //avoid only white spaces
          Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
        ],
      ],
      color: this.color,
      slug: '',
    });

    if (this.status) {
      this.statusForm.get('name')?.setValue(this.status.name);
      this.statusForm.get('slug')?.setValue(this.status.slug);
    }
  }

  public editStatus() {
    this.submitted = true;
    if (this.statusForm.valid && this.hasChanges()) {
      const status = this.statusForm.value as EditStatus;
      this.setStatus.emit(status);
    }
  }

  public hasChanges() {
    return this.statusForm.get('status')?.value !== this.status?.name;
  }

  public cancelEdit() {
    this.cancel.emit();
    this.submitted = false;
  }

  public leaveForm() {
    this.editStatus();
    this.cancelEdit();
  }

  public getRestoreFocusTarget() {
    if (this.status && this.status.id) {
      return `leave-status-edition-${this.status.id}`;
    } else {
      return 'show-create-status-form';
    }
  }
}
