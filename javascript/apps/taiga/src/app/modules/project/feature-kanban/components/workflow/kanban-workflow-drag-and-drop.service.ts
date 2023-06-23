/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { DestroyRef, ElementRef, Injectable, inject } from '@angular/core';
import { DragService, DropCandidate, DroppedEvent } from '@taiga/ui/drag';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Status, Story } from '@taiga/data';
import { Store } from '@ngrx/store';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { filter, map, take } from 'rxjs';
import { kanbanFeature } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer';
import { filterNil } from '~/app/shared/utils/operators';

@Injectable()
export class KanbanWorkflowDragAndDropService {
  public dragService = inject(DragService);
  public destroyRef = inject(DestroyRef);
  public store = inject(Store);
  public elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  public initDragAndDrop() {
    this.dragService
      .started<KanbanStory | Status>()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dragElm) => {
        if ('id' in dragElm.data) {
          const size = dragElm.el.getBoundingClientRect();
          this.elementRef.nativeElement.style.setProperty(
            '--drag-status-height',
            `${size.height}px`
          );
          this.store.dispatch(
            KanbanActions.statusDragStart({
              slug: dragElm.data.slug,
            })
          );
        } else if ('ref' in dragElm.data && dragElm.data.ref) {
          this.store.dispatch(
            KanbanActions.storyDragStart({ ref: dragElm.data.ref })
          );
        }
      });

    const handleDropEvent = async (dropEvent: DroppedEvent<Status, string>) => {
      const dragInProgress = document.querySelector<HTMLElement>(
        'tg-ui-drag-in-progress'
      );

      const drop = document.querySelector<HTMLElement>('.drop-target');

      if (dropEvent && drop && dragInProgress) {
        // when drag is cancel with ESC there is no animation
        if (dropEvent.dropZone) {
          await this.animateDrop(dragInProgress, drop);
        }

        if (dropEvent.candidate) {
          const candidate = {
            slug: dropEvent.candidate.result.slug,
            position: dropEvent.candidate.hPosition,
          };

          this.store.dispatch(
            KanbanActions.statusDropped({
              slug: dropEvent.source[0].slug,
              candidate,
            })
          );
        } else {
          this.store.dispatch(
            KanbanActions.statusDropped({
              slug: dropEvent.source[0].slug,
            })
          );
        }
      }
    };

    this.dragService
      .dropped<Status, string>()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event) => event?.dropCategory === 'status')
      )
      .subscribe((dropEvent) => {
        void handleDropEvent(dropEvent);
      });

    this.dragService
      .dropped<KanbanStory, string>()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event) => event?.dropCategory === 'story')
      )
      .subscribe((event) => {
        let candidate;

        if (event?.candidate) {
          const candidateRef = event.candidate.result.ref;
          if (candidateRef) {
            candidate = {
              ref: candidateRef,
              position: event.candidate.position,
            };
          }
        }

        if (event?.source[0].ref) {
          this.animateDropStory({
            ref: event?.source[0].ref,
            candidate,
            status: event?.dropZone,
          });
        }
      });

    this.dragService
      .over<Status, string>()
      .pipe(filter((event) => !!event?.source.length))
      .pipe(
        filter((event) => event?.dropCategory === 'status'),
        takeUntilDestroyed(this.destroyRef),
        map((event) => {
          let candidate;

          if (event?.over) {
            const candidateSlug = event.over?.result.slug;

            if (candidateSlug) {
              candidate = {
                slug: candidateSlug,
                position: event.over.hPosition,
              };
            }
          }

          return {
            source: event?.source[0].slug,
            candidate,
          };
        })
      )
      .subscribe(({ source, candidate }) => {
        if (source) {
          this.store.dispatch(
            KanbanActions.statusDropCandidate({
              slug: source,
              candidate,
            })
          );
        }
      });

    this.dragService
      .over<KanbanStory, string>()
      .pipe(filter((event) => !!event?.source.length))
      .pipe(
        filter((event) => event?.dropCategory === 'story'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        let candidate;
        if (event?.over) {
          const candidateRef = event.over?.result.ref;

          if (candidateRef) {
            candidate = {
              ref: candidateRef,
              position: event.over.position,
            };
          }
        }

        this.store.dispatch(
          KanbanActions.storyDropCandidate({
            ref: (event?.source[0] as KanbanStory).ref!,
            candidate,
            status: event?.dropZone as string,
          })
        );
      });
  }

  public animateDropStory(dropEvent: {
    ref: Story['ref'];
    candidate?: {
      ref: Story['ref'];
      position: DropCandidate['position'];
    };
    status?: Story['status']['slug'];
  }) {
    let drop: HTMLElement | null = null;

    if (!dropEvent.status) {
      drop = document.querySelector<HTMLElement>('.small-drag-shadow');
    }

    if (!drop) {
      drop = document.querySelector<HTMLElement>(
        '.drag-shadow:not(.small-drag-shadow)'
      );
    }

    const dragInProgress = document.querySelector<HTMLElement>(
      'tg-ui-drag-in-progress'
    );

    if (drop && dragInProgress) {
      this.animateDrop(dragInProgress, drop)
        .then(() => {
          this.store.dispatch(KanbanActions.storyDropped(dropEvent));
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  public animateDrop(el: HTMLElement, destination: HTMLElement) {
    return new Promise((resolve) => {
      const positionDrop = destination.getBoundingClientRect();
      const positionDrag = el.getBoundingClientRect();
      let buzz: Keyframe[] = [];
      const buzzDiffHorizontal = 4;
      const buzzDiffVertical = 1;
      const getTransform = (x: number, y: number) => {
        return `translate3D(${x}px, ${y}px, 0)`;
      };

      if (positionDrag.x > positionDrop.x) {
        buzz = [
          {
            transform: getTransform(
              positionDrop.x - buzzDiffHorizontal,
              positionDrop.y + buzzDiffVertical
            ),
          },
          {
            transform: getTransform(
              positionDrop.x + buzzDiffHorizontal,
              positionDrop.y - buzzDiffVertical
            ),
          },
          {
            transform: getTransform(
              positionDrop.x - buzzDiffHorizontal,
              positionDrop.y + buzzDiffVertical
            ),
          },
          {
            transform: getTransform(positionDrop.x, positionDrop.y),
          },
        ];
      } else {
        buzz = [
          {
            transform: getTransform(
              positionDrop.x + buzzDiffHorizontal,
              positionDrop.y + buzzDiffVertical
            ),
          },
          {
            transform: getTransform(
              positionDrop.x - buzzDiffHorizontal,
              positionDrop.y - buzzDiffVertical
            ),
          },
          {
            transform: getTransform(
              positionDrop.x + buzzDiffHorizontal,
              positionDrop.y + buzzDiffVertical
            ),
          },
          {
            transform: getTransform(positionDrop.x, positionDrop.y),
          },
        ];
      }

      document.body.classList.add('drop-in-progress');

      const animation = el.animate(
        [
          {
            transform: getTransform(positionDrop.x, positionDrop.y),
          },
        ],
        {
          duration: 100,
        }
      );

      void animation.finished
        .then(() => {
          return el.animate(buzz, {
            duration: 200,
            easing: 'ease-out',
          }).finished;
        })
        .then(() => {
          document.body.classList.remove('drop-in-progress');
          resolve(null);
        });
    });
  }

  public cancelStatus() {
    this.store
      .select(kanbanFeature.selectDraggingStatus)
      .pipe(take(1), filterNil())
      .subscribe(() => {
        this.dragService.cancelDrag();
      });
  }
}
