/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { Workflow } from '@taiga/data';
import {
  filter,
  fromEvent,
  Observable,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { findStory } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer.helpers';
import { selectKanbanState } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { KanbanState } from '../data-access/+state/reducers/kanban.reducer';

@Injectable({
  providedIn: 'root',
})
export class A11yDragService {
  constructor(
    private store: Store,
    private translocoService: TranslocoService,
    private liveAnnouncer: LiveAnnouncer
  ) {}

  public inProgress = false;
  private storyRef!: KanbanStory['ref'];
  private onDestroy: Subject<void> = new Subject();

  public dragStart(story: KanbanStory['ref']) {
    this.destroy();

    return new Observable(() => {
      this.onDestroy = new Subject();
      this.storyRef = story;

      this.dragOrDropStoryA11y();
      this.events();
      this.inProgress = true;

      return {
        unsubscribe: () => {
          this.destroy();
        },
      };
    });
  }

  public events() {
    const keyEscape$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
      filter((event) => event.code === 'Escape')
    );
    const keySpace$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
      filter((event) => event.code == 'Space')
    );

    // On press escape anywhere
    keyEscape$
      .pipe(
        take(1),
        takeUntil(this.onDestroy),
        tap((e) => {
          e.stopPropagation();
        }),
        switchMap(() => this.store.select(selectKanbanState).pipe(take(1)))
      )
      .subscribe((state) => {
        const storyA11y = state.activeA11yDragDropStory;
        const story = findStory(state, (it) => it.ref === this.storyRef);

        if (!storyA11y || !story) {
          return;
        }

        // Manage focus
        // Get current story element
        const statuses = Array.from(
          document.querySelectorAll<HTMLElement>('tg-kanban-status')
        );

        const currentStatus = statuses.find((status) => {
          return (
            status.getAttribute('data-id') === storyA11y.initialPosition?.status
          );
        });

        const currentStatusData: KanbanStory['status'] = {
          id: currentStatus!.getAttribute('data-id')!,
          color: Number(currentStatus!.getAttribute('data-color'))!,
          name: currentStatus!.getAttribute('data-name')!,
        };

        this.finish();
        this.store.dispatch(
          KanbanActions.cancelDragStoryA11y({
            story: storyA11y,
            status: currentStatusData,
          })
        );

        const announcementDrop = this.translocoService.translate(
          'kanban.dropped_live_announce',
          {
            title: story.title,
          }
        );

        const announcementReorderCancelled = this.translocoService.translate(
          'kanban.reorder_cancelled_live_announce'
        );

        const announcement = `${announcementDrop}. ${announcementReorderCancelled}`;

        this.liveAnnouncer.announce(announcement, 'assertive').then(
          () => {
            setTimeout(() => {
              const currentStatusStories = Array.from(
                currentStatus!.querySelectorAll<HTMLElement>('tg-kanban-story')
              );

              const currentStory = currentStatusStories.at(
                storyA11y.initialPosition.index!
              );

              if (currentStory) {
                currentStory
                  .querySelector<HTMLElement>(
                    '.story-kanban-ref-focus .story-title'
                  )!
                  .focus();
              }
              this.liveAnnouncer.clear();
            }, 50);
          },
          () => {
            // error
          }
        );
      });

    // On press space
    keySpace$.pipe(takeUntil(this.onDestroy), take(1)).subscribe((e) => {
      e.stopPropagation();
      this.dragOrDropStoryA11y();
      this.finish();
    });
  }

  public dragOrDropStoryA11y() {
    this.store
      .select(selectKanbanState)
      .pipe(take(1))
      .subscribe((state: KanbanState) => {
        const story = findStory(state, (it) => it.ref === this.storyRef);
        const workflow = state.workflow;

        if (!workflow || !story) {
          return;
        }

        const stories = state.stories[story.status.id];
        const index = state.stories[story.status.id].findIndex(
          (it) => it.ref === story.ref
        );

        const storyA11y: KanbanStoryA11y = {
          ref: story.ref,
          initialPosition: {
            status: story.status.id,
            index,
          },
          prevPosition: {
            status: story.status.id,
            index,
          },
          currentPosition: {
            status: story.status.id,
            index,
          },
        };
        if (!state.activeA11yDragDropStory.ref) {
          const announcement = this.translocoService.translate(
            'kanban.grabbed_live_announce',
            {
              title: story.title,
              position: index + 1,
            }
          );

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
            KanbanActions.dragStoryA11y({ story: storyA11y })
          );
        } else {
          const dropStoryData: {
            story: KanbanStoryA11y;
            workflow: Workflow;
            reorder?: {
              place: 'before' | 'after';
              ref: number;
            };
          } = {
            story: storyA11y,
            workflow,
          };

          if (stories.length > 1) {
            dropStoryData.reorder = {
              place: index === 0 ? 'before' : 'after',
              ref:
                index === 0 ? stories[index + 1].ref! : stories[index - 1].ref!,
            };
          }

          const announcementDrop = this.translocoService.translate(
            'kanban.dropped_live_announce',
            {
              title: story.title,
            }
          );

          const announcementFinalPosition = this.translocoService.translate(
            'kanban.final_position_live_announce',
            {
              storyIndex: index + 1,
              totalStories: stories.length,
              status: storyA11y.currentPosition.status,
            }
          );

          const announcement = `${announcementDrop}. ${announcementFinalPosition}`;

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
          this.store.dispatch(KanbanActions.dropStoryA11y(dropStoryData));
        }
      });
  }

  public finish() {
    this.inProgress = false;
    this.destroy();
  }

  private destroy() {
    if (!this.onDestroy.closed) {
      this.onDestroy.next();
      this.onDestroy.complete();
    }
  }
}
