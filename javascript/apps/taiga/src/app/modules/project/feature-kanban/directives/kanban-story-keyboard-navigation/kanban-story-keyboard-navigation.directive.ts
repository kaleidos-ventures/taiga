/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
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
import { KanbanStatusComponent } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';
import { KanbanWorkflowComponent } from '~/app/modules/project/feature-kanban/components/workflow/kanban-workflow.component';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import {
  selectActiveA11yDragDropStory,
  selectStories,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import {
  focusRef,
  getNextHorizontalStory,
  getNextStatus,
  getNextVerticalStory,
  getStatusFromStoryElement,
  scrollAndFocus,
} from './kanban-story-keyboard-navigation.helpers';

export interface KanbanStoryKeyboardNavigation {
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
  selector: '[tgKanbanStoryKeyboardNavigation]',
})
export class KanbanStoryKeyboardNavigationDirective implements OnInit {
  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll!: KanbanVirtualScrollDirective;

  @HostListener('keydown.arrowRight.prevent', ['$event.target', '$event.key'])
  @HostListener('keydown.arrowLeft.prevent', ['$event.target', '$event.key'])
  public onKeyDownArrow(
    current: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ): void {
    if (current.classList.contains('story-title')) {
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
    if (current.classList.contains('story-title')) {
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
      Stories: Record<Status['id'], KanbanStory[]>;
    }>
  ) {
    this.state.connect(
      'KanbanStoryA11y',
      this.store.select(selectActiveA11yDragDropStory)
    );
    this.state.connect('Stories', this.store.select(selectStories));
  }

  private storyNavigationVerticalA11y(
    el: HTMLElement,
    key: 'ArrowUp' | 'ArrowDown'
  ) {
    const currentIndex = Number(this.currentDraggedStory.currentPosition.index);
    const currentStatus = this.currentDraggedStory.currentPosition.status;
    const newIndex = this.calculateNewIndex(currentIndex, currentStatus, key);

    const { kanbanStatusComponents } = this.kanbanWorkflowComponent;
    const status = getStatusFromStoryElement(kanbanStatusComponents, el);

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
        id: status.statusId,
        color: status.statusColor,
        name: status.statusName,
      };

      const newPositionTranslation = this.translocoService.translate(
        'kanban.position_live_announce',
        {
          storyIndex: newIndex + 1,
          totalStories: Object.keys(this.state.get('Stories')[statusData.id])
            .length,
        }
      );

      const announcement = `${newPositionTranslation}`;
      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            if (el) {
              if (status?.cdkScrollable && this.currentDraggedStory.ref) {
                scrollAndFocus(
                  status,
                  el,
                  String(this.currentDraggedStory.ref)
                );
                focusRef(String(this.currentDraggedStory.ref));
              }
            }
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
      return status.getAttribute('data-id') === currentStatus;
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

      const el = nextStory.querySelector<HTMLElement>(
        '.story-kanban-ref-focus .story-title'
      );
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
        id: horizontalNavData.nextStatus.getAttribute('data-id')!,
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
          status: statusData.id,
          index: storyIndex,
        },
      };

      this.store.dispatch(
        KanbanActions.moveStoryA11y({ story, status: statusData })
      );

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
          totalStories: Object.keys(this.state.get('Stories')[statusData.id])
            .length,
        }
      );

      const announcement = `${statusNameTranslation}. ${newPositionTranslation}`;

      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            this.liveAnnouncer.clear();
            horizontalNavData.nextStatus
              .querySelectorAll('tg-kanban-story')
              [storyIndex].querySelector<HTMLElement>(
                '.story-kanban-ref-focus .story-title'
              )!
              .focus();
          }, 100);
        },
        () => {
          // error
        }
      );
    }
  }

  private storyNavigationHorizontal(
    el: HTMLElement,
    key: 'ArrowRight' | 'ArrowLeft'
  ) {
    const nextStatusEl = getNextStatus(el, key, true);

    const horizontalNavData = getNextHorizontalStory(el, nextStatusEl!);

    if (horizontalNavData && nextStatusEl) {
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
            setTimeout(() => {
              if (horizontalNavData.nextStory) {
                horizontalNavData.nextStory
                  .querySelector<HTMLElement>(
                    '.story-kanban-ref-focus .story-title'
                  )!
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
}
