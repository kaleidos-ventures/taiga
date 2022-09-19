/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Directive, HostListener, QueryList } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
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
    if (current.tagName === 'TG-KANBAN-STATUS') {
      this.statatusNavigation(current, key);
    } else if (current.tagName === 'A') {
      this.storyNavigationHorizontal(current, key);
    }
  }

  @HostListener('keydown.arrowDown.prevent', ['$event.target', '$event.key'])
  @HostListener('keydown.arrowUp.prevent', ['$event.target', '$event.key'])
  public onKeyDownArrowTopDown(
    current: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ): void {
    if (current.tagName === 'A') {
      this.storyNavigationVertical(current, key);
    }
  }

  constructor(
    private kanbanWorkflowComponent: KanbanWorkflowComponent,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService
  ) {}

  private storyNavigationVertical(
    el: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ) {
    let nextStory;

    if (key === 'ArrowDown') {
      nextStory = el.parentElement?.nextElementSibling;
    } else {
      nextStory = el.parentElement?.previousElementSibling;
    }

    if (nextStory) {
      nextStory.querySelector<HTMLElement>('a')!.focus();
    }
  }

  private storyNavigationHorizontal(
    el: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ) {
    const status = el.closest('tg-kanban-status');

    const statuses = Array.from(
      document.querySelectorAll<HTMLElement>('tg-kanban-status')
    );

    if (key === 'ArrowLeft') {
      statuses.reverse();
    }

    const currentStatusIndex = statuses.findIndex((it) => it === status);

    const nextStatus = statuses.find((it, index) => {
      if (index > currentStatusIndex) {
        return it.querySelector('tg-kanban-story');
      }

      return false;
    });

    const storyTop = el.getBoundingClientRect().top;
    const storyBottom = el.getBoundingClientRect().bottom;

    if (nextStatus) {
      const stories = Array.from(
        nextStatus.querySelectorAll<HTMLElement>('tg-kanban-story')
      );

      const nextStory = stories.reduce<{
        diff: number;
        story: HTMLElement;
      } | null>((storyCandidate, story) => {
        let diffTop = story.getBoundingClientRect().top - storyTop;
        let diffBotton = story.getBoundingClientRect().bottom - storyBottom;

        if (diffTop < 0) {
          diffTop = -diffTop;
        }

        if (diffBotton < 0) {
          diffBotton = -diffBotton;
        }

        const diff = diffBotton + diffTop;

        if (!storyCandidate) {
          return {
            story,
            diff,
          };
        } else if (diff < storyCandidate.diff) {
          return {
            story,
            diff,
          };
        }

        return storyCandidate;
      }, null);

      if (nextStory) {
        const nextStatusName =
          nextStatus.querySelector<HTMLElement>('.name')!.innerText;

        this.liveAnnouncer
          .announce(
            this.translocoService.translate('kanban.status_live_announce', {
              status: nextStatusName,
            }),
            'assertive'
          )
          .then(
            () => {
              // #hack, force the announcement to be made before the story title
              setTimeout(() => {
                nextStory.story.querySelector<HTMLElement>('a')!.focus();
                this.liveAnnouncer.clear();
              }, 50);
            },
            () => {
              // error
            }
          );
      }
    }
  }

  private statatusNavigation(el: HTMLElement, key: 'ArrowRight' | 'ArrowLeft') {
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
