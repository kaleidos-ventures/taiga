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
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Status, Workflow } from '@taiga/data';
import { KanbanWorkflowStatusKeyboardNavigation } from '../workflow/kanban-workflow-keyboard-navigation.directive';
import { KanbanWorkflowComponent } from '../workflow/kanban-workflow.component';
import { RxState } from '@rx-angular/state';
import { Store } from '@ngrx/store';
import {
  selectLoadingTasks,
  selectNewEventTasks,
  selectStatusFormOpen,
  selectStatusNewTasks,
  selectTasks,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { distinctUntilChanged, map, takeUntil, timer } from 'rxjs';
import { KanbanState } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { KanbanTask } from '~/app/modules/project/feature-kanban/kanban.model';
import { StatusScrollDynamicHeight } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import { filterNil } from '~/app/shared/utils/operators';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import { animate, style, transition, trigger } from '@angular/animations';

export interface KanbanComponentState {
  tasks: KanbanTask[];
  visible: boolean;
  loadingTasks: KanbanState['loadingTasks'];
  canEdit: boolean;
  showAddForm: boolean;
  emptyKanban: boolean | null;
  formAutoFocus: boolean;
  newEventTasks: KanbanState['newEventTasks'];
}

@Component({
  selector: 'tg-kanban-status',
  templateUrl: './kanban-status.component.html',
  styleUrls: ['./kanban-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('slideIn', [
      transition('* => on', [
        style({
          opacity: 0,
          transform: 'translateY(100%)',
        }),
        animate(
          `${KanbanStatusComponent.slideInTime}ms ease-out`,
          style({
            opacity: 1,
            transform: 'translateY(0%)',
          })
        ),
      ]),
    ]),
  ],
})
export class KanbanStatusComponent
  implements
    KanbanWorkflowStatusKeyboardNavigation,
    StatusScrollDynamicHeight,
    OnChanges,
    OnInit
{
  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll!: KanbanVirtualScrollDirective;

  @Input()
  public status!: Status;

  @Input()
  public workflow!: Workflow;

  @HostBinding('attr.aria-label') public get ariaLabel() {
    return this.transloco.translate('kanban.status_label', {
      statusName: this.status.name,
    });
  }

  @HostBinding('attr.tabindex') public get tabIndex() {
    return 0;
  }

  public model$ = this.state.select().pipe(
    map((state) => {
      return {
        // TODO: when design card is ready, calculate task height
        itemHeights: state.tasks.map((task) => {
          return 42 + (Math.ceil(task.name.length / 23) - 1) * 14;
        }),
        empty: state.loadingTasks ? false : !state.tasks.length,
        ...state,
      };
    })
  );

  public static slideInTime = 300;
  public color = '';

  private colors: Record<Status['color'], string> = {
    1: 'var(--color-gray60)',
    2: 'var(--color-ok60)',
    3: 'var(--color-notice60)',
    4: 'var(--color-info60)',
  };

  public get cdkScrollable() {
    return this.kanbanVirtualScroll.scrollStrategy.viewport;
  }

  public get columnSize() {
    return this.kanbanWorkflowComponent.statusColumnSize;
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private kanbanWorkflowComponent: KanbanWorkflowComponent,
    private transloco: TranslocoService,
    private store: Store,
    private state: RxState<KanbanComponentState>
  ) {
    this.state.set({ visible: false, tasks: [] });
  }

  public ngOnInit(): void {
    this.state.connect('newEventTasks', this.store.select(selectNewEventTasks));

    this.state.connect(
      'tasks',
      this.store.select(selectTasks).pipe(
        map((tasks) => {
          return tasks[this.status.slug];
        }),
        distinctUntilChanged()
      )
    );

    this.state.connect('loadingTasks', this.store.select(selectLoadingTasks));

    this.state.connect(
      'showAddForm',
      this.store.select(selectStatusFormOpen(this.status.slug))
    );

    this.watchNewTasks();
  }

  public onVisible() {
    this.state.set({ visible: true });
  }

  public onNotVisible() {
    this.state.set({ visible: false });
  }

  public addTask() {
    this.state.set({ formAutoFocus: true });

    this.store.dispatch(
      KanbanActions.openCreateTaskForm({ status: this.status.slug })
    );
  }

  public cancelTaskCreate() {
    this.store.dispatch(KanbanActions.closeCreateTaskForm());
  }

  public trackBySlug(_index: number, task: KanbanTask) {
    if ('tmpId' in task) {
      return task.tmpId;
    }

    return task.slug;
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

  private watchNewTasks() {
    this.state.hold(
      this.store
        .select(selectStatusNewTasks(this.status.slug))
        .pipe(filterNil()),
      (newTask) => {
        this.scrollToTask(newTask.tmpId);
      }
    );
  }

  private scrollToTask(tmpId: string) {
    if (!this.kanbanVirtualScroll) {
      return;
    }

    this.kanbanVirtualScroll.scrollStrategy.scrollTo({ bottom: 0 });

    // #hack
    // listen for 500ms for changes in the viewport height to scroll bottom
    // and make the new task visible
    this.kanbanVirtualScroll.scrollStrategy.updatedItemHeights$
      .pipe(takeUntil(timer(500)))
      .subscribe(() => {
        const el = this.nativeElement.querySelector<HTMLElement>(
          `tg-kanban-task[data-tmp-id="${tmpId}"]`
        );

        if (el) {
          requestAnimationFrame(() => {
            this.kanbanVirtualScroll.scrollStrategy.scrollTo({ bottom: 0 });
            this.store.dispatch(KanbanActions.scrolledToNewTask({ tmpId }));
          });
        }
      });
  }
}
