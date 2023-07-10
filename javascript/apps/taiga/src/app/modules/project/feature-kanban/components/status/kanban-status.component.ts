/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Status, Story, StoryDetail, Workflow } from '@taiga/data';
import { distinctUntilChanged, map, takeUntil, tap, timer } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { KanbanScrollManagerService } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-manager.service';
import { KanbanVirtualScrollDirective } from '~/app/modules/project/feature-kanban/custom-scroll-strategy/kanban-scroll-strategy';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import { KanbanState } from '~/app/modules/project/feature-kanban/data-access/+state/reducers/kanban.reducer';
import {
  selectActiveA11yDragDropStory,
  selectCreateStoryForm,
  selectHasDropCandidate,
  selectLoadingStories,
  selectNewEventStories,
  selectPermissionsError,
  selectStatusNewStories,
  selectStories,
} from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { KanbanStatusKeyboardNavigation } from '~/app/modules/project/feature-kanban/directives/kanban-status-keyboard-navigation/kanban-status-keyboard-navigation.directive';
import { StatusScrollDynamicHeight } from '~/app/modules/project/feature-kanban/directives/status-scroll-dynamic-height/scroll-dynamic-height.directive';
import {
  KanbanStory,
  KanbanStoryA11y,
} from '~/app/modules/project/feature-kanban/kanban.model';
import { EditStatus } from '~/app/modules/project/feature-kanban/models/edit-status.model';
import { selectStory } from '~/app/modules/project/story-detail/data-access/+state/selectors/story-detail.selectors';
import { PermissionsService } from '~/app/services/permissions.service';
import { AutoScrollService } from '~/app/shared/drag/services/autoscroll.service';
import { filterNil } from '~/app/shared/utils/operators';
import { UtilsService } from '~/app/shared/utils/utils-service.service';
import { KanbanWorkflowComponent } from '../workflow/kanban-workflow.component';

export const KanbanStatusComponentSlideInTime = 300;

export interface KanbanComponentState {
  stories: KanbanStory[];
  visible: boolean;
  loadingStories: KanbanState['loadingStories'];
  userIsAdmin: boolean;
  project: Project;
  canEdit: boolean;
  initialCanEdit: boolean;
  showAddForm: boolean;
  emptyKanban: boolean | null;
  formAutoFocus: boolean;
  newEventStories: KanbanState['newEventStories'];
  permissionsError: boolean;
  activeA11yDragDropStory: KanbanStoryA11y;
  hasDropCandidate: KanbanState['hasDropCandidate'];
  currentStory: StoryDetail | null;
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
          `${KanbanStatusComponentSlideInTime}ms ease-out`,
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
    OnInit,
    OnDestroy
{
  @ViewChild('createStoryWrapper')
  public createStoryWrapper?: ElementRef;

  @ViewChild(KanbanVirtualScrollDirective)
  public kanbanVirtualScroll?: KanbanVirtualScrollDirective;

  @ViewChild(CdkVirtualScrollViewport)
  public viewPort!: CdkVirtualScrollViewport;

  @ViewChild('statusOptions')
  public statusOptions?: ElementRef;

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
  public projectActionsDropdownState = false;
  public editStatusActive = false;
  public deleteStatusModal = false;

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

  public color = '';
  public isLastStatus = false;

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
    private permissionService: PermissionsService,
    private kanbanScrollManagerService: KanbanScrollManagerService
  ) {
    this.state.set({ visible: false, stories: [] });
    this.kanbanScrollManagerService.registerKanbanStatus(this);
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
          return stories[this.status.slug] ?? [];
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
      this.store.select(selectCreateStoryForm).pipe(
        map((openForm) => {
          return this.status.slug === openForm;
        })
      )
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
      'project',
      this.store.select(selectCurrentProject).pipe(
        filterNil(),
        tap((project) => {
          if (!project.userIsAdmin) {
            this.cancelEditStatus();
          }
        })
      )
    );

    this.state.connect(
      'canEdit',
      this.permissionService.hasPermissions$('story', ['modify'])
    );
    this.state.connect('currentStory', this.store.select(selectStory));

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

  public ngOnDestroy(): void {
    this.kanbanScrollManagerService.destroyKanbanStatus(this);
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

  public displayEditStatus() {
    this.editStatusActive = true;
  }

  public cancelEditStatus() {
    this.editStatusActive = false;
  }

  public leaveEditStatus(status: EditStatus) {
    this.updateStatusName(status);
  }

  public updateStatusName(status: EditStatus) {
    if (status) {
      this.store.dispatch(
        KanbanActions.editStatus({
          undo: {
            status: {
              name: this.status.name,
              slug: this.status.slug,
            },
          },
          status: {
            name: status.name,
            slug: status.slug,
          },
          workflow: this.workflow.slug,
        })
      );
    }
    this.cancelEditStatus();
  }

  public handleDeleteStatus() {
    const stories = this.state.get('stories');
    if (!stories.length) {
      this.submitDeleteStatus();
    } else if (stories.length && this.workflow.statuses.length === 1) {
      this.deleteStatusModal = true;
      this.isLastStatus = true;
    } else {
      this.deleteStatusModal = true;
      this.isLastStatus = false;
    }
  }

  public submitDeleteStatus(moveToStatus?: Status['slug']) {
    this.projectActionsDropdownState = false;

    this.store.dispatch(
      KanbanActions.deleteStatus({
        status: this.status.slug,
        workflow: this.workflow.slug,
        moveToStatus,
      })
    );
  }

  private fillColor() {
    this.color = `var(--color-${UtilsService.statusColor(this.status.color)})`;
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
