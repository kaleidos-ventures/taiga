/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Workflow } from '@taiga/data';
import { KineticScrollService } from '~/app/shared/scroll/kinetic-scroll.service';
import { KanbanStatusComponent } from '../status/kanban-status.component';
import { KanbanKeyboardNavigation } from '~/app/modules/project/feature-kanban/directives/kanban-workflow-keyboard-navigation/kanban-keyboard-navigation.directive';

@Component({
  selector: 'tg-kanban-workflow',
  templateUrl: './kanban-workflow.component.html',
  styleUrls: ['./kanban-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KineticScrollService],
})
export class KanbanWorkflowComponent
  implements KanbanKeyboardNavigation, AfterViewInit
{
  @Input()
  public workflow!: Workflow;

  @ViewChild(CdkVirtualScrollViewport)
  public cdkScrollable!: CdkVirtualScrollViewport;

  @ViewChildren(KanbanStatusComponent)
  public kanbanStatusComponents!: QueryList<KanbanStatusComponent>;

  public activeStatusIndex = 0;
  public statusColumnSize = 292;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private kineticScrollService: KineticScrollService
  ) {
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.statusColumnSize}px`
    );
  }

  public trackBySlug(_index: number, obj: { slug: string }) {
    return obj.slug;
  }

  public initKineticScroll(): void {
    const statusScroll =
      this.nativeElement.querySelector<HTMLElement>('tui-scrollbar');

    if (statusScroll) {
      this.kineticScrollService.start(statusScroll, this.cdkScrollable);
    }
  }

  public ngAfterViewInit() {
    this.initKineticScroll();
  }
}
