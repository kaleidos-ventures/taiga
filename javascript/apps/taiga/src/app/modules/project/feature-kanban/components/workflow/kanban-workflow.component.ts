/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Story, Workflow } from '@taiga/data';
import { filter, Observable } from 'rxjs';
import { KanbanScrollManagerService } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-manager.service';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectDragging } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { KanbanStatusKeyboardNavigation } from '~/app/modules/project/feature-kanban/directives/kanban-status-keyboard-navigation/kanban-status-keyboard-navigation.directive';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { DropCandidate } from '~/app/shared/drag/drag.model';
import { AutoScrollService } from '~/app/shared/drag/services/autoscroll.service';
import { DragService } from '~/app/shared/drag/services/drag.service';
import { KineticScrollService } from '~/app/shared/scroll/kinetic-scroll.service';
import { KanbanStatusComponent } from '../status/kanban-status.component';

@UntilDestroy()
@Component({
  selector: 'tg-kanban-workflow',
  templateUrl: './kanban-workflow.component.html',
  styleUrls: ['./kanban-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KineticScrollService, RxState],
})
export class KanbanWorkflowComponent
  implements KanbanStatusKeyboardNavigation, AfterViewInit, OnDestroy
{
  @Input()
  public workflow!: Workflow;

  @Input()
  public userIsAdmin!: boolean;

  @ViewChild(CdkVirtualScrollViewport)
  public cdkScrollable!: CdkVirtualScrollViewport;

  @ViewChildren(KanbanStatusComponent)
  public kanbanStatusComponents!: QueryList<KanbanStatusComponent>;

  public activeStatusIndex = 0;
  public statusColumnSize = 292;

  public movingStories$!: Observable<KanbanStory[]>;

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private el: ElementRef,
    private kineticScrollService: KineticScrollService,
    private autoScrollService: AutoScrollService,
    private dragService: DragService,
    private store: Store,
    private kanbanScrollManagerService: KanbanScrollManagerService
  ) {
    this.kanbanScrollManagerService.registerKanbanWorkflow(this);
    this.nativeElement.style.setProperty(
      '--column-width',
      `${this.statusColumnSize}px`
    );
  }

  public dragAndDrop() {
    this.movingStories$ = this.store.select(selectDragging);

    this.dragService
      .started<KanbanStory>()
      .pipe(untilDestroyed(this))
      .subscribe((story) => {
        this.store.dispatch(KanbanActions.storyDragStart({ ref: story.ref! }));
      });

    this.dragService
      .dropped()
      .pipe(untilDestroyed(this))
      .subscribe((event) => {
        let candidate;

        if (event?.candidate) {
          const candidateRef = (event.candidate.result as KanbanStory).ref;
          if (candidateRef) {
            candidate = {
              ref: candidateRef,
              position: event.candidate.position,
            };
          }
        }

        this.animateDrop({
          ref: (event?.source[0] as KanbanStory).ref!,
          candidate,
          status: event?.dropZone as string,
        });
      });

    this.dragService
      .over()
      .pipe(
        untilDestroyed(this),
        filter((event) => !!event?.source.length)
      )
      .subscribe((event) => {
        let candidate;
        if (event?.over) {
          const candidateRef = (event.over?.result as KanbanStory).ref;

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

  public listenAutoScroll() {
    this.autoScrollService
      .listen(this.cdkScrollable, 'horizontal', 300)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  public animateDrop(dropEvent: {
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
      'tg-drag-in-progress'
    );

    if (drop && dragInProgress) {
      const positionDrop = drop.getBoundingClientRect();
      const positionDrag = dragInProgress.getBoundingClientRect();
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

      const animation = dragInProgress.animate(
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
          return dragInProgress.animate(buzz, {
            duration: 200,
            easing: 'ease-out',
          }).finished;
        })
        .then(() => {
          this.store.dispatch(KanbanActions.storyDropped(dropEvent));
          document.body.classList.remove('drop-in-progress');
        });
    }
  }

  public trackBySlug(_index: number, obj: { slug: string }) {
    return obj.slug;
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
    this.dragAndDrop();
    this.listenAutoScroll();
  }

  public ngOnDestroy(): void {
    this.kanbanScrollManagerService.destroyKanbanWorkflow();
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
