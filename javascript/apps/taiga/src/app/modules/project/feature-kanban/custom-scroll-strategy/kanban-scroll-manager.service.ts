/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Status } from '@taiga/data';
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { isInside } from '~/app/shared/utils/is-inside';
import { filterNil } from '~/app/shared/utils/operators';
import { KanbanStatusComponent } from '../components/status/kanban-status.component';
import { KanbanWorkflowComponent } from '../components/workflow/kanban-workflow.component';
import {
  selectStory,
  selectWorkflow,
} from '../data-access/+state/selectors/kanban.selectors';
import { KanbanStory } from '../kanban.model';

@Injectable({
  providedIn: 'root',
})
export class KanbanScrollManagerService {
  private kanbanStatuses$ = new BehaviorSubject([] as KanbanStatusComponent[]);
  private kanbanWorkflow$ = new BehaviorSubject(
    null as KanbanWorkflowComponent | null
  );

  constructor(private store: Store) {}

  public scrollToRef(
    ref: NonNullable<KanbanStory['ref']>,
    position: 'start' | 'end' | 'center' | 'nearest' = 'nearest',
    animateIfVisible = true
  ) {
    return new Observable((subscriber) => {
      const complete = () => {
        subscriber.next();
        subscriber.complete();
      };

      this.store
        .select(selectStory(ref))
        .pipe(
          filterNil(),
          take(1),
          switchMap((story: KanbanStory) => {
            const status = story.status;
            return this.moveToStatus(status).pipe(
              map(() => {
                return story;
              })
            );
          }),
          switchMap((story) => {
            return this.getKanbanStatusByStory(story).pipe(
              map((status) => {
                return {
                  status,
                  story,
                };
              })
            );
          })
        )
        .subscribe(({ status }) => {
          const storyEl = this.getStoryEl(ref);
          if (status?.kanbanVirtualScroll) {
            if (storyEl) {
              if (
                !isInside(
                  storyEl,
                  status.cdkScrollable.elementRef.nativeElement
                )
              ) {
                setTimeout(() => {
                  storyEl.scrollIntoView({
                    block: position,
                    behavior: animateIfVisible ? 'smooth' : 'auto',
                  });
                }, 150);
              }
              complete();
            } else {
              const index = status.state
                .get('stories')
                .findIndex((it) => it.ref === ref);

              this.scrollToIndexUntilVisible(status, index, ref).subscribe(
                (storyEl) => {
                  storyEl.scrollIntoView({ block: position });
                }
              );
            }
          }
        });
    });
  }

  public registerKanbanStatus(kanbanStatus: KanbanStatusComponent) {
    this.kanbanStatuses$.next([...this.kanbanStatuses$.value, kanbanStatus]);
  }

  public registerKanbanWorkflow(kanbanWorkflow: KanbanWorkflowComponent) {
    this.kanbanWorkflow$.next(kanbanWorkflow);
  }

  public destroyKanbanStatus(kanbanStatus: KanbanStatusComponent) {
    const kanbanStatuses = this.kanbanStatuses$.value.filter(
      (it) => it !== kanbanStatus
    );
    this.kanbanStatuses$.next(kanbanStatuses);
  }

  public destroyKanbanWorkflow() {
    this.kanbanWorkflow$.next(null);
  }

  private moveToStatus(status: Status) {
    return new Observable((subscriber) => {
      this.store
        .select(selectWorkflow)
        .pipe(
          filterNil(),
          take(1),
          tap((workflow) => {
            const statusIndex = workflow.statuses.findIndex(
              (workflowStatuses) => status.id === workflowStatuses.id
            );
            const runScroll = () => {
              const statusEl = this.kanbanStatuses$.value.find(
                (it) => status.id === it.status.id
              );

              if (statusEl) {
                const workflowPosition = (
                  this.kanbanWorkflow$.value?.cdkScrollable.elementRef
                    .nativeElement as HTMLElement
                ).getBoundingClientRect();

                const statusPosition =
                  statusEl.nativeElement.getBoundingClientRect();

                return !(
                  statusPosition.left >= workflowPosition.left &&
                  statusPosition.left <= workflowPosition.right
                );
              }

              return true;
            };

            const scroll = () => {
              if (runScroll()) {
                this.kanbanWorkflow$.value?.cdkScrollable.scrollToIndex(
                  statusIndex
                );
              }

              const statusEl = this.kanbanStatuses$.value.find(
                (it) => it.status.id === status.id
              );

              if (statusEl) {
                if (runScroll()) {
                  this.kanbanWorkflow$.value?.cdkScrollable.scrollToIndex(
                    statusIndex
                  );
                }

                subscriber.next();
                subscriber.complete();
              } else {
                requestAnimationFrame(() => scroll());
              }
            };
            requestAnimationFrame(() => scroll());
          })
        )
        .subscribe();
    });
  }

  private scrollToIndexUntilVisible(
    status: KanbanStatusComponent,
    index: number,
    ref: NonNullable<KanbanStory['ref']>
  ): Observable<HTMLElement> {
    return new Observable((subscriber) => {
      const search = () => {
        status.cdkScrollable.scrollToIndex(index);

        status
          .kanbanVirtualScroll!.scrollStrategy.afterViewCheck$.pipe(take(1))
          .subscribe(() => {
            const elm = this.getStoryEl(ref);

            if (elm) {
              subscriber.next(elm);
              subscriber.complete();
            } else {
              search();
            }
          });
      };

      search();
    });
  }

  private scrollStable(cdkScrollable: CdkVirtualScrollViewport) {
    let scrollTop = 0;

    return new Observable((subscriber) => {
      const search = () => {
        const newScrollTop = cdkScrollable.elementRef.nativeElement.scrollTop;

        if (newScrollTop === scrollTop) {
          subscriber.next();
          subscriber.complete();
        } else {
          scrollTop = newScrollTop;
          requestAnimationFrame(() => search());
        }
      };

      search();
    });
  }

  private waitUntilGetStoryEl(
    ref: NonNullable<KanbanStory['ref']>
  ): Observable<HTMLElement> {
    return this.waitUntil<HTMLElement>(() => this.getStoryEl(ref));
  }

  private waitUntil<T>(condition: () => unknown): Observable<T> {
    return new Observable((subscriber) => {
      const search = () => {
        const result = condition();

        if (result) {
          subscriber.next(result as T);
          subscriber.complete();
        } else {
          requestAnimationFrame(() => search());
        }
      };

      search();
    });
  }

  private getKanbanStatusByStory(story: KanbanStory) {
    return this.kanbanStatuses$.pipe(
      take(1),
      map((kanbanStatuses) => {
        return kanbanStatuses.find((kanbanStatus) => {
          return kanbanStatus.status.id == story.status.id;
        });
      }),
      filter(
        (kanbanStatus): kanbanStatus is KanbanStatusComponent => !!kanbanStatus
      ),
      switchMap((kanbanStatus) => {
        // wait until scroll is filled
        return this.waitUntil(() => kanbanStatus.kanbanVirtualScroll).pipe(
          map(() => {
            return kanbanStatus;
          })
        );
      })
    );
  }

  private getStoryEl(ref: NonNullable<KanbanStory['ref']>) {
    return document.querySelector<HTMLElement>(`[data-ref='${ref}']`);
  }
}
