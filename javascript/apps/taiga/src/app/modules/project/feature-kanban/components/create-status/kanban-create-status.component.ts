/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { TuiButtonModule } from '@taiga-ui/core';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectWorkflow } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { EditStatus } from '~/app/modules/project/feature-kanban/models/edit-status.model';
import { RestoreFocusTargetDirective } from '~/app/shared/directives/restore-focus/restore-focus-target.directive';
import { EditStatusComponent } from '../edit-status/edit-status.component';

@Component({
  selector: 'tg-kanban-create-status',
  templateUrl: './kanban-create-status.component.html',
  styleUrls: ['./kanban-create-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    EditStatusComponent,
    TuiButtonModule,
    RestoreFocusTargetDirective,
  ],
})
export class KanbanCreateStatusComponent implements OnInit {
  @Input({ required: true })
  public openCreateStatusForm!: boolean;

  @Output()
  public navigateLeft = new EventEmitter();

  @Output()
  public closeForm = new EventEmitter<void>();

  public workflow = this.store.selectSignal(selectWorkflow);

  public showAddForm = false;
  public columnSize = 292;
  public statusMaxLength = 30;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(private el: ElementRef, private store: Store) {
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.columnSize}px`
    );
  }

  public ngOnInit() {
    this.showAddForm = this.openCreateStatusForm;
  }

  public generateStatus(status: EditStatus) {
    const workflow = this.workflow();
    if (workflow) {
      this.store.dispatch(
        KanbanActions.createStatus({
          status: {
            name: status.name,
            color: status.color,
          },
          workflow: workflow.slug,
        })
      );
    }
    this.reset();
  }

  public cancelForm() {
    this.reset();
  }

  public leaveForm(status: EditStatus) {
    this.generateStatus(status);
    this.reset();
  }

  public showForm() {
    this.showAddForm = true;
  }

  private reset() {
    this.showAddForm = false;
    this.closeForm.next();
  }
}
