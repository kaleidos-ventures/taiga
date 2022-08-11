/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Status } from '@taiga/data';
import { KanbanWorkflowStatusKeyboardNavigation } from '../workflow/kanban-workflow-keyboard-navigation';
import { KanbanWorkflowComponent } from '../workflow/kanban-workflow.component';

@Component({
  selector: 'tg-kanban-status',
  templateUrl: './kanban-status.component.html',
  styleUrls: ['./kanban-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanStatusComponent
  implements KanbanWorkflowStatusKeyboardNavigation, OnChanges
{
  @Input()
  public status!: Status;

  @HostBinding('attr.aria-label') public get ariaLabel() {
    return this.status.name;
  }

  @HostBinding('attr.tabindex') public get tabIndex() {
    return 0;
  }

  public color = '';

  public visible = false;

  private colors: Record<Status['color'], string> = {
    1: 'var(--color-gray60)',
    2: 'var(--color-ok60)',
    3: 'var(--color-notice60)',
    4: 'var(--color-info60)',
  };

  constructor(
    private el: ElementRef,
    private kanbanWorkflowComponent: KanbanWorkflowComponent
  ) {}

  public get columnSize() {
    return this.kanbanWorkflowComponent.statusColumnSize;
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  public onVisible() {
    this.visible = true;
  }

  public onNotVisible() {
    this.visible = false;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.status) {
      this.fillColor();
    }
  }

  private fillColor() {
    if (this.colors[this.status.color]) {
      this.color = this.colors[this.status.color];
    }
  }
}
