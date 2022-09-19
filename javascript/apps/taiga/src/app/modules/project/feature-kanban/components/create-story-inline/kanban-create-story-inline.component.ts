/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Status, Workflow } from '@taiga/data';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { v4 } from 'uuid';

@Component({
  selector: 'tg-create-story-inline',
  templateUrl: './kanban-create-story-inline.component.html',
  styleUrls: ['./kanban-create-story-inline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCreateStoryInlineComponent implements AfterViewInit {
  @Input()
  public status!: Status;

  @Input()
  public workflow!: Workflow;

  @Input()
  public autoFocus = true;

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('title')
  public titleElement!: ElementRef;

  @HostListener('keydown.esc.prevent') public esc() {
    this.cancelSubmit();
  }

  public maxLength = 500;

  public form = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.maxLength(this.maxLength),
        Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/),
      ],
    ],
  });

  public submitted = false;

  constructor(public fb: FormBuilder, private store: Store) {}

  public submit() {
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.store.dispatch(
        KanbanActions.createStory({
          story: {
            tmpId: v4(),
            name: this.form.get('title')!.value,
            status: this.status.slug,
            workflow: this.workflow.slug,
          },
          workflow: this.workflow.slug,
        })
      );

      this.reset();
      (this.titleElement.nativeElement as HTMLElement).focus();
    } else {
      this.submitted = true;
    }
  }

  public cancelSubmit() {
    this.cancel.emit();
    this.reset();
  }

  public leaveForm(active: boolean) {
    if (!active) {
      this.submit();
      this.cancelSubmit();
    }
  }

  public ngAfterViewInit(): void {
    if (this.autoFocus) {
      (this.titleElement.nativeElement as HTMLElement).focus();
    }
  }

  private reset() {
    this.form.reset();
    this.submitted = false;
  }
}
