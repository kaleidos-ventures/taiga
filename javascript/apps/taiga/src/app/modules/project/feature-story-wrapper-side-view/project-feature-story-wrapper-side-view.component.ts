/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { CdkDragMove } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { selectShowStoryView } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
interface WrapperSideViewState {
  showView: boolean;
}
@Component({
  selector: 'tg-project-feature-story-wrapper-side-view',
  templateUrl: './project-feature-story-wrapper-side-view.component.html',
  styleUrls: ['./project-feature-story-wrapper-side-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectFeatureStoryWrapperSideViewComponent
  implements AfterViewInit
{
  @ViewChild('resizeSidepanel') public sidepanel?: ElementRef<HTMLElement>;
  @ViewChild('dragHandle') public dragHandle!: ElementRef<HTMLElement>;

  @Input() public kanbanWidth = 0;

  public readonly model$ = this.state.select();
  public sidepanelWidth = 300;
  public dragging = false;
  public sidepanelSetted = false;
  public isCollapsed = false;

  private minWidthCollapsed = 440;
  private minWidthUncollapsed = 472;

  constructor(
    private store: Store,
    private cd: ChangeDetectorRef,
    private state: RxState<WrapperSideViewState>
  ) {
    this.state.connect('showView', this.store.select(selectShowStoryView));
  }

  public ngAfterViewInit(): void {
    this.setCollapsed(this.isCollapsed);
    this.cd.detectChanges();
  }

  public dragMove(dragHandle: HTMLElement, event: CdkDragMove<unknown>) {
    this.sidepanelWidth = window.innerWidth - event.pointerPosition.x;
    dragHandle.style.transform = 'translate(0, 0)';
    this.cd.detectChanges();
  }

  public isDragging(isDragging: boolean) {
    this.dragging = isDragging;
  }

  public calculateMinInlineSize() {
    const quarterWidth = this.kanbanWidth / 4;
    const calculatedMinWidth = this.isCollapsed
      ? this.minWidthCollapsed
      : this.minWidthUncollapsed;
    if (this.kanbanWidth && quarterWidth >= calculatedMinWidth) {
      return `${quarterWidth}px`;
    } else {
      return `${calculatedMinWidth}px`;
    }
  }

  public calculateMaxInlineSize() {
    return `${this.kanbanWidth / 2}px`;
  }

  public showDragbar() {
    const calculatedMinWidth = this.isCollapsed
      ? this.minWidthCollapsed
      : this.minWidthUncollapsed;

    return this.kanbanWidth / 2 >= calculatedMinWidth;
  }

  public setCollapsed(isCollapsed: boolean) {
    const calculatedDifference =
      this.minWidthUncollapsed - this.minWidthCollapsed;

    if (this.isCollapsed) {
      this.sidepanelWidth = this.sidepanelWidth + calculatedDifference;
    } else {
      this.sidepanelWidth = this.sidepanelWidth - calculatedDifference;
    }
    this.isCollapsed = isCollapsed;
  }
}
