/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Optional,
  SimpleChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { distinctUntilChanged, map } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { selectActiveA11yDragDropStory } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { KanbanStory } from '~/app/modules/project/feature-kanban/kanban.model';
import { filterNil } from '~/app/shared/utils/operators';
import { KanbanStatusComponent } from '../status/kanban-status.component';

export interface StoryState {
  isA11yDragInProgress: boolean;
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
export class KanbanStoryComponent implements OnChanges, OnInit {
  @Input()
  public story!: KanbanStory;

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

  public readonly model$ = this.state.select();

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    public state: RxState<StoryState>,
    private location: Location,
    private store: Store,
    private el: ElementRef,
    @Optional()
    @Inject(KanbanStatusComponent)
    private kabanStatus: KanbanStatusComponent
  ) {}

  public ngOnInit(): void {
    this.state.connect(
      'isA11yDragInProgress',
      this.store.select(selectActiveA11yDragDropStory).pipe(
        map((it) => it.ref === this.story.ref),
        distinctUntilChanged()
      )
    );
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.story && this.story._shadow) {
      requestAnimationFrame(() => {
        this.scrollToDragStoryIfNotVisible();
      });
    }
  }

  public openStory(event: MouseEvent) {
    event.preventDefault();

    if (this.story.ref) {
      this.location.go(
        `project/${this.state.get('project').id}/${
          this.state.get('project').slug
        }/stories/${this.story.ref}`,
        undefined,
        {
          fromCard: true,
        }
      );
    }
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
