/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, style, transition, trigger } from '@angular/animations';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Status, Workflow, Story } from '@taiga/data';
import { KanbanStatusKeyboardNavigation } from '~/app/modules/project/feature-kanban/directives/kanban-workflow-keyboard-navigation/kanban-keyboard-navigation.directive';
import { KanbanWorkflowComponent } from '../workflow/kanban-workflow.component';
import { RxState } from '@rx-angular/state';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, takeUntil, timer } from 'rxjs';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { KanbanState } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer';
import {
  selectActiveA11yDragDropStory,
  selectHasDropCandidate,
  selectLoadingStories,
  selectNewEventStories,
  selectPermissionsError,
  selectStatusFormOpen,
  selectStatusNewStories,
  selectStories,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { StatusScrollDynamicHeight } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { filterNil } from '~/app/shared/utils/operators';
import { AutoScrollService } from '~/app/shared/drag/services/autoscroll.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { PermissionsService } from '~/app/services/permissions.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface KanbanComponentState {
  stories: KanbanStory[];
  visible: boolean;
  loadingStories: KanbanState['loadingStories'];
  canEdit: boolean;
  initialCanEdit: boolean;
  showAddForm: boolean;
  emptyKanban: boolean | null;
  formAutoFocus: boolean;
  newEventStories: KanbanState['newEventStories'];
  permissionsError: boolean;
  activeA11yDragDropStory: KanbanStoryA11y;
  hasDropCandidate: KanbanState['hasDropCandidate'];
}

@UntilDestroy()
@Component({
  selector: 'tg-kanban-status',
  templateUrl: './kanban-status.component.html',
  styleUrls: ['./kanban-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('slideIn', [
      transition('* => on', [
        style({
          opacity: 0,
          transform: 'translateY(100%)',
        }),
        animate(
          `${KanbanStatusComponent.slideInTime}ms ease-out`,
          style({
            opacity: 1,
            transform: 'translateY(0%)',
          })
        ),
      ]),
    ]),
  ],
})
export class KanbanStatusComponent
  implements
    KanbanStatusKeyboardNavigation,
    StatusScrollDynamicHeight,
    OnChanges,
    OnInit
{
  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll?: KanbanVirtualScrollDirective;

  @Input()
  public status!: Status;

  @Input()
  public workflow!: Workflow;

  @HostBinding('attr.aria-label') public get ariaLabel() {
    return this.transloco.translate('kanban.status_label', {
      statusName: this.status.name,
    });
  }

  @HostBinding('attr.data-name') public get statusName() {
    return this.status.name;
  }

  @HostBinding('attr.data-slug') public get statusSlug() {
    return this.status.slug;
  }

  @HostBinding('attr.data-color') public get statusColor() {
    return this.status.color;
  }

  @HostBinding('attr.tabindex') public get tabIndex() {
    return 0;
  }

  @ViewChild(CdkVirtualScrollViewport)
  public set scrollable(cdkScrollable: CdkVirtualScrollViewport) {
    this.cdkScrollable = cdkScrollable;

    if (this.cdkScrollable) {
      this.autoScrollService
        .listen(this.cdkScrollable, 'vertical', 100, 0.7)
        .pipe(untilDestroyed(this))
        .subscribe();
    }
  }

  public cdkScrollable!: CdkVirtualScrollViewport;

  public model$ = this.state.select().pipe(
    map((state) => {
      return {
        // TODO: when design card is ready, calculate story height
        itemHeights: state.stories.map((story) => {
          return 42 + (Math.ceil(story.title.length / 23) - 1) * 14;
        }),
        empty: state.loadingStories ? false : !state.stories.length,
        ...state,
      };
    })
  );

  public static slideInTime = 300;
  public color = '';

  private colors: Record<Status['color'], string> = {
    1: 'var(--color-gray60)',
    2: 'var(--color-ok60)',
    3: 'var(--color-notice60)',
    4: 'var(--color-info60)',
  };

  public get columnSize() {
    return this.kanbanWorkflowComponent.statusColumnSize;
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    public state: RxState<KanbanComponentState>,
    private el: ElementRef,
    private kanbanWorkflowComponent: KanbanWorkflowComponent,
    private transloco: TranslocoService,
    private store: Store,
    private autoScrollService: AutoScrollService,
    private permissionService: PermissionsService
  ) {
    this.state.set({
      visible: false,
      stories: [],
      initialCanEdit: this.permissionService.hasPermissions('story', [
        'modify',
      ]),
    });
  }

  public ngOnInit(): void {
    this.state.connect(
      'newEventStories',
      this.store.select(selectNewEventStories)
    );

    this.state.connect(
      'stories',
      this.store.select(selectStories).pipe(
        map((stories) => {
          return stories[this.status.slug];
        }),
        distinctUntilChanged()
      )
    );

    this.state.connect(
      'loadingStories',
      this.store.select(selectLoadingStories)
    );

    this.state.connect(
      'showAddForm',
      this.store.select(selectStatusFormOpen(this.status.slug))
    );

    this.state.connect(
      'permissionsError',
      this.store.select(selectPermissionsError)
    );

    this.state.connect(
      'activeA11yDragDropStory',
      this.store.select(selectActiveA11yDragDropStory)
    );

    this.state.connect(
      'hasDropCandidate',
      this.store.select(selectHasDropCandidate)
    );

    this.state.connect(
      'canEdit',
      this.permissionService.hasPermissions$('story', ['modify'])
    );

    this.watchNewStories();
  }

  public onVisible() {
    this.state.set({ visible: true });
  }

  public onNotVisible() {
    this.state.set({ visible: false });
  }

  public addStory() {
    this.state.set({ formAutoFocus: true });

    this.store.dispatch(
      KanbanActions.openCreateStoryForm({ status: this.status.slug })
    );
  }

  public cancelStoryCreate() {
    this.store.dispatch(KanbanActions.closeCreateStoryForm());
  }

  public onDragStart(story: Story) {
    this.store.dispatch(KanbanActions.storyDragStart({ ref: story.ref }));
  }

  public trackByRef(_index: number, story: KanbanStory) {
    if ('tmpId' in story) {
      return story.tmpId;
    }

    return story.ref;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.status) {
      this.fillColor();
    }
  }

  public showSmallDragShadowClass(story: KanbanStory) {
    return (
      this.state.get('hasDropCandidate') && story._dragging && !story._shadow
    );
  }

  public disableScroll(story: KanbanStory) {
    const canEdit = this.state.get('canEdit')
      ? true
      : this.state.get('initialCanEdit');

    return story._shadow || !story.ref || !canEdit;
  }

  private fillColor() {
    if (this.colors[this.status.color]) {
      this.color = this.colors[this.status.color];
    }
  }

  private watchNewStories() {
    this.state.hold(
      this.store
        .select(selectStatusNewStories(this.status.slug))
        .pipe(filterNil()),
      (newStory) => {
        this.scrollToStory(newStory.tmpId);
      }
    );
  }

  private scrollToStory(tmpId: string) {
    if (!this.kanbanVirtualScroll) {
      return;
    }

    this.kanbanVirtualScroll.scrollStrategy.scrollTo({ bottom: 0 });

    // #hack
    // listen for 500ms for changes in the viewport height to scroll bottom
    // and make the new story visible
    this.kanbanVirtualScroll.scrollStrategy.updatedItemHeights$
      .pipe(takeUntil(timer(500)))
      .subscribe(() => {
        const el = this.nativeElement.querySelector<HTMLElement>(
          `tg-kanban-story[data-tmp-id="${tmpId}"]`
        );

        if (el) {
          requestAnimationFrame(() => {
            this.kanbanVirtualScroll?.scrollStrategy.scrollTo({ bottom: 0 });
            this.store.dispatch(KanbanActions.scrolledToNewStory({ tmpId }));
          });
        }
      });
  }
}
