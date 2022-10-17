/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnChanges,
  Optional,
  SimpleChanges,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Workflow } from '@taiga/data';
import { filter, fromEvent, take } from 'rxjs';
import { fetchStory } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { selectActiveA11yDragDropStory } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { filterNil } from '~/app/shared/utils/operators';
import { KanbanStatusComponent } from '../status/kanban-status.component';

export interface StoryState {
  kanbanStoryA11y: KanbanStoryA11y;
  project: Project;
}

@UntilDestroy()
@Component({
  selector: 'tg-kanban-story',
  templateUrl: './kanban-story.component.html',
  styleUrls: ['./kanban-story.component.css'],
  providers: [RxState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanStoryComponent implements OnChanges {
  @Input()
  public story!: KanbanStory;

  @Input()
  public workflow!: Workflow;

  @Input()
  public stories!: KanbanStory[];

  @Input()
  @HostBinding('attr.data-position')
  public index!: number;

  @Input()
  public total = 0;

  @HostBinding('class.drag-shadow')
  public get dragShadow() {
    return this.story._shadow || this.story._dragging;
  }

  @HostBinding('attr.data-ref')
  public get ref() {
    return this.story.ref;
  }

  @HostListener('keydown.space.prevent', ['$event.target', '$event.code'])
  public dragA11yStart() {
    const keyEscape$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
      filter((event) => event.code === 'Escape')
    );
    const keySpace$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
      filter((event) => event.code == 'Space')
    );

    // On press escape anywhere
    keyEscape$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
      const currentDraggedStory = this.state.get('kanbanStoryA11y');

      // Manage focus
      // Get current story element
      const statuses = Array.from(
        document.querySelectorAll<HTMLElement>('tg-kanban-status')
      );

      const currentStatus = statuses.find((status) => {
        return (
          status.getAttribute('data-slug') ===
          currentDraggedStory.initialPosition?.status
        );
      });

      const currentStatusStories = Array.from(
        currentStatus!.querySelectorAll<HTMLElement>('tg-kanban-story')
      );

      const currentStory = currentStatusStories.at(
        currentDraggedStory.initialPosition.index!
      );

      this.store.dispatch(
        KanbanActions.cancelDragStoryA11y({ story: currentDraggedStory })
      );

      const announcementDrop = this.translocoService.translate(
        'kanban.dropped_live_announce',
        {
          title: this.story.title,
        }
      );

      const announcementReorderCancelled = this.translocoService.translate(
        'kanban.reorder_cancelled_live_announce'
      );

      const announcement = `${announcementDrop}. ${announcementReorderCancelled}`;

      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            if (currentStory) {
              currentStory
                .querySelector<HTMLElement>('.story-keyboard-navigation')!
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

    // FIX: Space should be pressed anywhere
    keySpace$.pipe(take(1), untilDestroyed(this)).subscribe(() => {
      this.dragOrDropStoryA11y();
    });
  }

  public readonly model$ = this.state.select();

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private store: Store,
    private state: RxState<StoryState>,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService,
    private el: ElementRef,
    @Optional()
    @Inject(KanbanStatusComponent)
    private kabanStatus: KanbanStatusComponent
  ) {
    this.state.connect(
      'kanbanStoryA11y',
      this.store.select(selectActiveA11yDragDropStory)
    );
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
  }

  public dragOrDropStoryA11y() {
    const currentStory = this.state.get('kanbanStoryA11y');

    const story: KanbanStoryA11y = {
      ref: this.story.ref,
      initialPosition: {
        status: this.story.status.slug,
        index: this.index,
      },
      prevPosition: {
        status: this.story.status.slug,
        index: this.index,
      },
      currentPosition: {
        status: this.story.status.slug,
        index: this.index,
      },
    };
    if (!currentStory.ref) {
      const announcement = this.translocoService.translate(
        'kanban.grabbed_live_announce',
        {
          title: this.story.title,
          position: this.index + 1,
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

      this.store.dispatch(KanbanActions.dragStoryA11y({ story }));
    } else {
      const dropStoryData: {
        story: KanbanStoryA11y;
        workflow: Workflow;
        reorder?: {
          place: 'before' | 'after';
          ref: number;
        };
      } = {
        story,
        workflow: this.workflow,
      };

      if (this.stories.length > 1) {
        dropStoryData.reorder = {
          place: this.index === 0 ? 'before' : 'after',
          ref:
            this.index === 0
              ? this.stories[this.index + 1].ref!
              : this.stories[this.index - 1].ref!,
        };
      }

      const announcementDrop = this.translocoService.translate(
        'kanban.dropped_live_announce',
        {
          title: this.story.title,
        }
      );

      const announcementFinalPosition = this.translocoService.translate(
        'kanban.final_position_live_announce',
        {
          storyIndex: this.index + 1,
          totalStories: this.stories.length,
          status: story.currentPosition.status,
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
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.story && this.story._shadow) {
      requestAnimationFrame(() => {
        this.scrollToDragStoryIfNotVisible();
      });
    }
  }

  public openStory() {
    this.store.dispatch(
      fetchStory({
        projectSlug: this.state.get('project').slug,
        storyRef: this.story.ref!,
      })
    );
  }

  private scrollToDragStoryIfNotVisible() {
    const statusScrollBottom =
      this.kabanStatus.kanbanVirtualScroll?.scrollStrategy.viewport?.elementRef.nativeElement.getBoundingClientRect()
        .bottom;

    if (statusScrollBottom) {
      const newTop =
        this.nativeElement.getBoundingClientRect().bottom -
        statusScrollBottom +
        1;

      if (newTop > 0) {
        this.kabanStatus.kanbanVirtualScroll?.scrollStrategy.scrollTo({
          top: newTop,
        });
      }
    }
  }
}
