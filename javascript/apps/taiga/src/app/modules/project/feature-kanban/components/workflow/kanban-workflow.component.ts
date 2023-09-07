/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  CdkVirtualScrollViewport,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
} from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  forwardRef,
  inject,
} from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Workflow } from '@taiga/data';
import { KanbanScrollManagerService } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-manager.service';
import {
  KanbanStatusKeyboardNavigation,
  KanbanStatusKeyboardNavigationDirective,
} from '~/app/modules/project/feature-kanban/directives/kanban-status-keyboard-navigation/kanban-status-keyboard-navigation.directive';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { AutoScrollService } from '@taiga/ui/drag';
import { KineticScrollService } from '~/app/shared/scroll/kinetic-scroll.service';
import { KanbanStatusComponent } from '../status/kanban-status.component';
import { selectLoadingStatus } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KanbanWorkflowDragAndDropService } from './kanban-workflow-drag-and-drop.service';
import {
  selectDragging,
  selectDraggingStatus,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { Store } from '@ngrx/store';
import { kanbanFeature } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer';
import { animate, style, transition, trigger } from '@angular/animations';
import { KanbanEmptyComponent } from '../empty/kanban-empty.component';
import { A11yDragStoryDirective } from '../story/kanban-story-a11y-drag.directive';
import { KanbanStoryComponent } from '../story/kanban-story.component';
import { KanbanCreateStatusComponent } from '../create-status/kanban-create-status.component';
import { TuiScrollbarModule } from '@taiga-ui/core/components/scrollbar';
import { CommonModule } from '@angular/common';
import { DropZoneDirective } from '@taiga/ui/drag/directives/drop-zone.directive';
import { DraggableDirective } from '@taiga/ui/drag/directives/draggable.directive';
import { DragInProgressComponent } from '@taiga/ui/drag/components/drag-in-progress.component';

@Component({
  selector: 'tg-kanban-workflow',
  templateUrl: './kanban-workflow.component.html',
  styleUrls: ['./kanban-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KineticScrollService, RxState, KanbanWorkflowDragAndDropService],
  animations: [
    // prevent flicker on status drop
    trigger('dropStatusTransition', [
      transition(':leave', [animate('50ms', style({}))]),
    ]),
  ],
  standalone: true,
  imports: [
    CommonModule,
    TuiScrollbarModule,
    DropZoneDirective,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    forwardRef(() => KanbanStatusComponent),
    KanbanStatusKeyboardNavigationDirective,
    DraggableDirective,
    KanbanCreateStatusComponent,
    DragInProgressComponent,
    KanbanStoryComponent,
    A11yDragStoryDirective,
    KanbanEmptyComponent,
  ],
})
export class KanbanWorkflowComponent
  implements
    KanbanStatusKeyboardNavigation,
    AfterViewInit,
    OnDestroy,
    OnChanges
{
  @Input({ required: true })
  public workflow!: Workflow;

  @Input({ required: true })
  public columns!: ReturnType<typeof kanbanFeature.selectColums>;

  @Input({ required: true })
  public userIsAdmin!: boolean;

  @ViewChild(CdkVirtualScrollViewport)
  public cdkScrollable!: CdkVirtualScrollViewport;

  @ViewChildren(KanbanStatusComponent)
  public kanbanStatusComponents!: QueryList<KanbanStatusComponent>;

  public activeStatusIndex = 0;
  public statusColumnSize = 292;
  public openCreateStatusForm = false;
  public statusIsBeingCreated = this.store.selectSignal(selectLoadingStatus);

  public movingStories = this.store.selectSignal(selectDragging);
  public movingStatus = this.store.selectSignal(selectDraggingStatus);

  private destroyRef = inject(DestroyRef);

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private kineticScrollService: KineticScrollService,
    private autoScrollService: AutoScrollService,
    private kanbanScrollManagerService: KanbanScrollManagerService,
    private store: Store,
    private kanbanWorkflowDragAndDropService: KanbanWorkflowDragAndDropService
  ) {
    this.kanbanScrollManagerService.registerKanbanWorkflow(this);
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.statusColumnSize}px`
    );
  }

  public listenAutoScroll() {
    this.autoScrollService
      .listen(this.cdkScrollable, 'horizontal', 300)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  public trackById(
    _index: number,
    obj: ReturnType<typeof kanbanFeature.selectColums>[0]
  ) {
    return obj.status.id;
  }

  public trackByStorySlug(_index: number, story: KanbanStory) {
    return story.slug;
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
    this.kanbanWorkflowDragAndDropService.initDragAndDrop();
    this.listenAutoScroll();
  }

  public ngOnDestroy(): void {
    this.kanbanScrollManagerService.destroyKanbanWorkflow();
  }

  public ngOnChanges(changes: SimpleChanges) {
    // user lose admin permissions
    if (
      changes.userIsAdmin &&
      changes.userIsAdmin.previousValue &&
      !this.userIsAdmin
    ) {
      this.kanbanWorkflowDragAndDropService.cancelStatus();
    }
  }

  public navigateLeft() {
    const leftMargin = 44;
    this.cdkScrollable.scrollTo({
      left:
        this.cdkScrollable.getViewportSize() +
        this.statusColumnSize +
        leftMargin,
    });
  }
}
