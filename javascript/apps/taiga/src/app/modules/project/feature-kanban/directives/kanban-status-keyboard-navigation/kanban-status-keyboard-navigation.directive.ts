/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Directive,
  HostListener,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Status, Workflow } from '@taiga/data';
import { Observable } from 'rxjs';
import { type KanbanStatusComponent } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';
import { KanbanWorkflowComponent } from '~/app/modules/project/feature-kanban/components/workflow/kanban-workflow.component';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import {
  selectActiveA11yDragDropStory,
  selectStories,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { inViewport } from '~/app/shared/utils/in-viewport';

export interface KanbanStatusKeyboardNavigation {
  nativeElement: HTMLElement;
}

export interface KanbanKeyboardNavigation {
  workflow: Workflow;
  cdkScrollable: CdkVirtualScrollViewport;
  kanbanStatusComponents: QueryList<KanbanStatusComponent>;
  statusColumnSize: number;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[tgKanbanStatusKeyboardNavigation]',
  standalone: true,
})
export class KanbanStatusKeyboardNavigationDirective implements OnInit {
  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll!: KanbanVirtualScrollDirective;

  @HostListener('keydown.arrowRight', ['$event', '$event.target', '$event.key'])
  @HostListener('keydown.arrowLeft', ['$event', '$event.target', '$event.key'])
  public onKeyDownArrow(
    event: KeyboardEvent,
    current: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ): void {
    if (current.tagName === 'TG-KANBAN-STATUS') {
      event.preventDefault();
      this.statusNavigation(current, key);
    }
  }

  public currentDraggedStory!: KanbanStoryA11y;

  public ngOnInit(): void {
    this.state.hold(this.state.select('KanbanStoryA11y'), (activeStory) => {
      this.currentDraggedStory = activeStory;
    });
  }

  constructor(
    private kanbanWorkflowComponent: KanbanWorkflowComponent,
    private store: Store,
    private state: RxState<{
      KanbanStoryA11y: KanbanStoryA11y;
      Stories: Record<Status['id'], KanbanStory[]>;
    }>
  ) {
    this.state.connect(
      'KanbanStoryA11y',
      this.store.select(selectActiveA11yDragDropStory)
    );
    this.state.connect('Stories', this.store.select(selectStories));
  }

  private statusNavigation(el: HTMLElement, key: 'ArrowRight' | 'ArrowLeft') {
    const {
      cdkScrollable,
      workflow,
      kanbanStatusComponents,
      statusColumnSize,
    } = this.kanbanWorkflowComponent;

    const focusedComponent = kanbanStatusComponents.find((component) => {
      return component.nativeElement === el;
    });

    let currentTabIndex = workflow.statuses.findIndex((status) => {
      return status === focusedComponent?.status;
    });

    if (key === 'ArrowRight') {
      currentTabIndex++;
    } else {
      currentTabIndex--;
    }

    if (currentTabIndex < 0) {
      currentTabIndex = workflow.statuses.length - 1;
    } else if (currentTabIndex > workflow.statuses.length - 1) {
      currentTabIndex = 0;
    }

    const status = workflow.statuses[currentTabIndex];
    const position = currentTabIndex * statusColumnSize;
    const viewportSize = cdkScrollable.getViewportSize();

    // get the component if it is rendered
    const component = kanbanStatusComponents.find((component) => {
      return component.status === status;
    });

    if (component) {
      if (!inViewport(component.nativeElement)) {
        if (key === 'ArrowRight') {
          // scroll only the enough to the status to be visible
          cdkScrollable.scrollTo({
            left: statusColumnSize - (viewportSize - position),
          });
        } else {
          cdkScrollable.scrollTo({ left: position });
        }
      }

      component.nativeElement.focus();
    } else {
      cdkScrollable.scrollTo({ left: position });

      this.safeGetStatusComponent(status, kanbanStatusComponents).subscribe(
        (component) => {
          component.nativeElement.focus();
        }
      );
    }
  }

  // wait until the status column is rendered
  private safeGetStatusComponent(
    status: Status,
    components: QueryList<KanbanStatusComponent>
  ): Observable<KanbanStatusComponent> {
    return new Observable((subscriber) => {
      const searchComponent = () => {
        const component = components.find((component) => {
          return component.status === status;
        });

        if (component) {
          subscriber.next(component);
          subscriber.complete();
        } else {
          requestAnimationFrame(searchComponent);
        }
      };

      searchComponent();
    });
  }
}
