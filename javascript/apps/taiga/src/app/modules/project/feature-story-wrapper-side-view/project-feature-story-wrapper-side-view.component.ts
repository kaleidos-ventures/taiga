/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { StoryView } from '@taiga/data';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import {
  selectLoadingStory,
  selectStoryView,
} from '../story-detail/data-access/+state/selectors/story-detail.selectors';
import { StoryDetailComponent } from '../story-detail/story-detail.component';
import { StoryWrapperSideViewDirective } from './story-wrapper-side-view-resize.directive';
import { StoryDetailSkeletonComponent } from '../story-detail-skeleton/story-detail-skeleton.component';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
interface WrapperSideViewState {
  selectedStoryView: StoryView;
  loadingStory: boolean;
}

@Component({
  selector: 'tg-project-feature-story-wrapper-side-view',
  templateUrl: './project-feature-story-wrapper-side-view.component.html',
  styleUrls: ['./project-feature-story-wrapper-side-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    ResizedDirective,
    StoryDetailComponent,
    A11yModule,
    StoryDetailSkeletonComponent,
    StoryWrapperSideViewDirective,
  ],
})
export class ProjectFeatureStoryWrapperSideViewComponent implements OnChanges {
  @ViewChild(StoryDetailComponent)
  public storyDetailComponent?: StoryDetailComponent;

  @ViewChild('resizeSidepanel') public sidepanel?: ElementRef<HTMLElement>;
  @ViewChild('dragHandle') public dragHandle!: ElementRef<HTMLElement>;

  @Input() public kanbanWidth = 0;

  public readonly model$ = this.state.select();
  public sidepanelWidth = 0;
  public dragging = false;
  public sidepanelSetted = false;
  public sidebarOpen =
    LocalStorageService.get<boolean>('story_view_sidebar') ?? false;
  public minInlineSize = '';
  public maxInlineSize = '';

  public minWidthCollapsed = 440;
  public minWidthUncollapsed = 500;
  public widthToForceCollapse = 500;

  constructor(
    private store: Store,
    private state: RxState<WrapperSideViewState>,
    private localStorage: LocalStorageService
  ) {
    this.state.connect('selectedStoryView', this.store.select(selectStoryView));
    this.state.connect('loadingStory', this.store.select(selectLoadingStory));
  }

  public dragMove(dragHandle: HTMLElement, event: MouseEvent) {
    this.sidepanelWidth = window.innerWidth - event.clientX;
    dragHandle.style.transform = 'translate(0, 0)';
  }

  public isDragging(isDragging: boolean) {
    this.dragging = isDragging;

    if (!isDragging) {
      this.localStorage.set('story_width', this.sidepanelWidth);
    }
  }

  public showDragbar() {
    const calculatedMinWidth = this.sidebarOpen
      ? this.minWidthCollapsed
      : this.minWidthUncollapsed;

    return this.kanbanWidth / 2 >= calculatedMinWidth;
  }

  public onToggleSidebar() {
    this.localStorage.set('story_view_sidebar', !this.sidebarOpen);
    this.sidebarOpen = !this.sidebarOpen;
    this.minInlineSize = this.calculateMinInlineSize();
  }

  public checkIfForceCollapse() {
    // Forcing collapse if width is inferior to widthToForceCollapse, only work on side-view.
    const selectedStoryView = this.state.get('selectedStoryView');
    if (
      this.sidepanelWidth <= this.widthToForceCollapse &&
      selectedStoryView === 'side-view'
    ) {
      this.sidebarOpen = false;
    }
  }

  public calculateInlineSize() {
    this.minInlineSize = this.calculateMinInlineSize();
    this.maxInlineSize = this.calculateMaxInlineSize();
  }

  public calculateMinInlineSize() {
    const quarterWidth = this.kanbanWidth / 4;
    const calculatedMinWidth = this.sidebarOpen
      ? this.minWidthUncollapsed
      : this.minWidthCollapsed;
    if (this.kanbanWidth && quarterWidth >= calculatedMinWidth) {
      return `${quarterWidth}px`;
    } else {
      return `${calculatedMinWidth}px`;
    }
  }

  public calculateMaxInlineSize() {
    return `${this.kanbanWidth / 2}px`;
  }

  public setInitialSidePanelWidth() {
    const storedStoryWidth = this.localStorage.get<number>('story_width');

    if (storedStoryWidth) {
      this.sidepanelWidth = storedStoryWidth;
      return;
    }

    this.sidepanelWidth = this.kanbanWidth / 4;

    const calculatedDifference =
      this.minWidthUncollapsed - this.minWidthCollapsed;

    if (this.sidebarOpen) {
      this.sidepanelWidth = this.sidepanelWidth + calculatedDifference;
    } else {
      this.sidepanelWidth = this.sidepanelWidth - calculatedDifference;
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.kanbanWidth.currentValue && !this.sidepanelWidth) {
      this.setInitialSidePanelWidth();
      this.checkIfForceCollapse();
    }
    if (changes.kanbanWidth.currentValue) {
      this.calculateInlineSize();
    }
  }
}
