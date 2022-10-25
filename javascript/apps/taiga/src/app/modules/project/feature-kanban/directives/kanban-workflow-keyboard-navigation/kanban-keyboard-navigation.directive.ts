/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Directive,
  HostListener,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Status, Workflow } from '@taiga/data';
import { Observable } from 'rxjs';
import { KanbanStatusComponent } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';
import { KanbanWorkflowComponent } from '~/app/modules/project/feature-kanban/components/workflow/kanban-workflow.component';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectActiveA11yDragDropStory } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { inViewport } from '~/app/shared/utils/in-viewport';
import {
  focusRef,
  getNextHorizontalStory,
  getNextStatus,
  getNextVerticalStory,
  getStatusFromStoryElement,
  scrollAndFocus,
} from './kanban-keyboard-navigation.helpers';

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
  selector: '[tgKanbanKeyboardNavigation]',
})
export class KanbanKeyboardNavigationDirective implements OnInit {
  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll!: KanbanVirtualScrollDirective;

  @HostListener('keydown.arrowRight.prevent', ['$event.target', '$event.key'])
  @HostListener('keydown.arrowLeft.prevent', ['$event.target', '$event.key'])
  public onKeyDownArrow(
    current: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ): void {
    if (current.tagName === 'TG-KANBAN-STATUS') {
      this.statatusNavigation(current, key);
    } else if (current.tagName === 'A') {
      if (this.currentDraggedStory.ref) {
        this.storyNavigationHorizontalA11y(current, key);
      } else {
        this.storyNavigationHorizontal(current, key);
      }
    }
  }

  @HostListener('keydown.arrowDown.prevent', ['$event.target', '$event.key'])
  @HostListener('keydown.arrowUp.prevent', ['$event.target', '$event.key'])
  public onKeyDownArrowTopDown(
    current: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ): void {
    if (current.tagName === 'A') {
      if (this.currentDraggedStory.ref) {
        this.storyNavigationVerticalA11y(current, key);
      } else {
        this.storyNavigationVertical(current, key);
      }
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
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService,
    private store: Store,
    private state: RxState<{
      KanbanStoryA11y: KanbanStoryA11y;
    }>
  ) {
    this.state.connect(
      'KanbanStoryA11y',
      this.store.select(selectActiveA11yDragDropStory)
    );
  }

  private storyNavigationVerticalA11y(
    el: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ) {
    const currentIndex = Number(this.currentDraggedStory.currentPosition.index);
    const currentStatus = this.currentDraggedStory.currentPosition.status;
    const newIndex = this.calculateNewIndex(currentIndex, currentStatus, key);

    const nextStory = getNextVerticalStory(el, key) || el;

    const { kanbanStatusComponents } = this.kanbanWorkflowComponent;
    const status = getStatusFromStoryElement(kanbanStatusComponents, nextStory);

    if (nextStory) {
      const el = nextStory.querySelector<HTMLElement>('a');

      if (status?.cdkScrollable && el) {
        const nextRef = nextStory.dataset.ref;

        if (nextRef) {
          scrollAndFocus(status, el, nextRef);

          focusRef(nextRef);
        }
      }
    }

    const story = {
      ref: this.currentDraggedStory.ref,
      initialPosition: {
        status: this.currentDraggedStory.initialPosition.status,
        index: this.currentDraggedStory.initialPosition.index,
      },
      prevPosition: {
        status: this.currentDraggedStory.currentPosition.status,
        index: currentIndex,
      },
      currentPosition: {
        status: this.currentDraggedStory.currentPosition.status,
        index: newIndex,
      },
    };

    if (status) {
      const statusData: KanbanStory['status'] = {
        slug: status.statusSlug,
        color: status.statusColor,
        name: status.statusName,
      };

      const statusStories =
        status.nativeElement.querySelectorAll<HTMLElement>('tg-kanban-story');

      const newPositionTranslation = this.translocoService.translate(
        'kanban.position_live_announce',
        {
          storyIndex: newIndex + 1,
          totalStories: statusStories.length,
        }
      );

      const announcement = `${newPositionTranslation}`;
      this.liveAnnouncer.clear();
      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            this.liveAnnouncer.clear();
          }, 50);
        },
        () => {
          // error
        }
      );

      this.store.dispatch(
        KanbanActions.moveStoryA11y({ story, status: statusData })
      );
    }
  }

  private calculateNewIndex(
    currentIndex: number,
    currentStatus: string,
    key: 'ArrowUp' | 'ArrowDown'
  ) {
    if (key === 'ArrowDown') {
      const currentStatusEl = this.getCurrentStatusEl(currentStatus);
      const currentStatusStories = this.getCurrentStoriesEl(currentStatusEl!);
      const currentStatusStoriesLength = currentStatusStories!.length;

      return currentIndex + 1 >= currentStatusStoriesLength
        ? currentStatusStoriesLength - 1
        : currentIndex + 1;
    } else {
      return currentIndex === 0 ? currentIndex : currentIndex - 1;
    }
  }

  private getCurrentStatusEl(currentStatus: string): HTMLElement | undefined {
    const statuses = Array.from(
      document.querySelectorAll<HTMLElement>('tg-kanban-status')
    );

    return statuses.find((status) => {
      return status.getAttribute('data-slug') === currentStatus;
    });
  }

  private getCurrentStoriesEl(
    statusEl: HTMLElement
  ): HTMLElement[] | undefined {
    return Array.from(
      statusEl.querySelectorAll<HTMLElement>('tg-kanban-story')
    );
  }

  private storyNavigationVertical(
    el: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ) {
    const { kanbanStatusComponents } = this.kanbanWorkflowComponent;

    const nextStory = getNextVerticalStory(el, key);

    if (nextStory) {
      const status = getStatusFromStoryElement(
        kanbanStatusComponents,
        nextStory
      );

      const el = nextStory.querySelector<HTMLElement>('a');

      if (status?.cdkScrollable && el) {
        const nextRef = nextStory.dataset.ref;

        if (nextRef) {
          scrollAndFocus(status, el, nextRef);

          focusRef(nextRef);
        }
      }
    }
  }

  private storyNavigationHorizontalA11y(
    el: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ) {
    const status = this.currentDraggedStory.currentPosition.status;
    const currentStatusEl = this.getCurrentStatusEl(status);
    const currentStatusStoriesEl = this.getCurrentStoriesEl(currentStatusEl!);

    const currentStoryEl = currentStatusStoriesEl!.at(
      this.currentDraggedStory.currentPosition.index!
    );

    const nextStatusEl = getNextStatus(currentStoryEl!, key, false);

    const horizontalNavData = getNextHorizontalStory(
      currentStoryEl!,
      nextStatusEl!
    );

    if (horizontalNavData.nextStatus) {
      const statusData: KanbanStory['status'] = {
        slug: horizontalNavData.nextStatus.getAttribute('data-slug')!,
        color: Number(
          horizontalNavData.nextStatus.getAttribute('data-color')!
        )!,
        name: horizontalNavData.nextStatus.getAttribute('data-name')!,
      };

      const nextStatusStories = Array.from(
        horizontalNavData.nextStatus.querySelectorAll<HTMLElement>(
          'tg-kanban-story'
        )
      );

      let storyIndex = 0;

      if (horizontalNavData?.nextStory) {
        const nextStoryIndex = Number(
          horizontalNavData.nextStory?.getAttribute('data-position')
        );

        const isLastStory =
          nextStoryIndex ===
          Number(nextStatusStories.at(-1)?.getAttribute('data-position'));

        storyIndex = isLastStory ? nextStoryIndex + 1 : nextStoryIndex;
      }

      // Live announcement
      const statusNameTranslation = this.translocoService.translate(
        'kanban.status_live_announce',
        {
          status: statusData.name,
        }
      );

      const newPositionTranslation = this.translocoService.translate(
        'kanban.position_live_announce',
        {
          storyIndex: storyIndex + 1,
          totalStories: nextStatusStories.length + 1,
        }
      );

      const announcement = `${statusNameTranslation}. ${newPositionTranslation}`;

      this.liveAnnouncer.clear();
      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            this.liveAnnouncer.clear();
          }, 50);
        },
        () => {
          // error
        }
      );

      const story = {
        ref: this.currentDraggedStory.ref,
        initialPosition: {
          status: this.currentDraggedStory.initialPosition.status,
          index: this.currentDraggedStory.initialPosition.index,
        },
        prevPosition: {
          status: this.currentDraggedStory.currentPosition.status,
          index: this.currentDraggedStory.currentPosition.index,
        },
        currentPosition: {
          status: statusData.slug,
          index: storyIndex,
        },
      };

      this.store.dispatch(
        KanbanActions.moveStoryA11y({ story, status: statusData })
      );

      setTimeout(() => {
        horizontalNavData.nextStatus
          .querySelectorAll('tg-kanban-story')
          [storyIndex].querySelector<HTMLElement>('a')!
          .focus();
      }, 100);
    }
  }

  private storyNavigationHorizontal(
    el: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ) {
    const nextStatusEl = getNextStatus(el, key, true);

    const horizontalNavData = getNextHorizontalStory(el, nextStatusEl!);

    if (horizontalNavData) {
      const nextStatusName =
        horizontalNavData.nextStatus.querySelector<HTMLElement>(
          '.name'
        )!.innerText;

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
              if (horizontalNavData.nextStory) {
                horizontalNavData.nextStory
                  .querySelector<HTMLElement>('a')!
                  .focus();
                this.liveAnnouncer.clear();
              }
            }, 50);
          },
          () => {
            // error
          }
        );
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
