/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Directive, HostListener, QueryList } from '@angular/core';
import { Status, Workflow } from '@taiga/data';
import { Observable } from 'rxjs';
import { inViewport } from '~/app/shared/utils/in-viewport';
import { KanbanStatusComponent } from '../status/kanban-status.component';
import { KanbanWorkflowComponent } from './kanban-workflow.component';

export interface KanbanWorkflowStatusKeyboardNavigation {
  nativeElement: HTMLElement;
}

export interface KanbanWorkflowKeyboardNavigation {
  workflow: Workflow;
  cdkScrollable: CdkVirtualScrollViewport;
  kanbanStatusComponents: QueryList<KanbanStatusComponent>;
  statusColumnSize: number;
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tg-kanban-workflow',
})
export class KanbanWorkflowKeyboardNavigationDirective {
  @HostListener('keydown.arrowRight.prevent', ['$event.target', '$event.key'])
  @HostListener('keydown.arrowLeft.prevent', ['$event.target', '$event.key'])
  public onKeyDownArrow(
    current: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ): void {
    const {
      cdkScrollable,
      workflow,
      kanbanStatusComponents,
      statusColumnSize,
    } = this.kanbanWorkflowComponent;

    const focusedComponent = kanbanStatusComponents.find((component) => {
      return component.nativeElement === current;
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

  constructor(private kanbanWorkflowComponent: KanbanWorkflowComponent) {}

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
