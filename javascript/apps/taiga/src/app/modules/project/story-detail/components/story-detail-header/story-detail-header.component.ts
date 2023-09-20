/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, StoryDetail, StoryView } from '@taiga/data';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import {
  selectStory,
  selectStoryView,
} from '~/app/modules/project/story-detail/data-access/+state/selectors/story-detail.selectors';
import { filterNil } from '~/app/shared/utils/operators';
import {
  TuiButtonModule,
  TuiSvgModule,
  TuiHostedDropdownModule,
  TuiDataListModule,
} from '@taiga-ui/core';
import { Location, CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { TooltipDirective } from '@taiga/ui/tooltip';
import { Router } from '@angular/router';
import { StoryDetailActions } from '~/app/modules/project/story-detail/data-access/+state/actions/story-detail.actions';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';

export interface StoryDetailHeaderState {
  project: Project;
  story: StoryDetail;
  selectedStoryView: StoryView;
}

@Component({
  selector: 'tg-story-detail-header',
  templateUrl: './story-detail-header.component.html',
  styleUrls: ['./story-detail-header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiButtonModule,
    TuiSvgModule,
    TuiHostedDropdownModule,
    TuiDataListModule,
    TooltipDirective,
    HasPermissionDirective,
  ],
})
export class StoryDetailHeaderComponent {
  @Output()
  public closeStory = new EventEmitter<void>();

  @Output()
  public showDeleteStoryConfirm = new EventEmitter<void>();

  public model$ = this.state.select();
  public linkCopied = false;
  public hintShown = false;
  public resetCopyLinkTimeout?: ReturnType<typeof setTimeout>;
  public showCopyLinkHintTimeout?: ReturnType<typeof setTimeout>;
  public dropdownState = false;
  public storyOptionsState = false;
  public storyViewOptions: { id: StoryView; translation: string }[] = [
    {
      id: 'modal-view',
      translation: 'story.modal_view',
    },
    {
      id: 'side-view',
      translation: 'story.side_panel_view',
    },
    {
      id: 'full-view',
      translation: 'story.full_width_view',
    },
  ];

  constructor(
    private cd: ChangeDetectorRef,
    public state: RxState<StoryDetailHeaderState>,
    private clipboard: Clipboard,
    private store: Store,
    private router: Router,
    private location: Location
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'story',
      this.store.select(selectStory).pipe(filterNil())
    );
    this.state.connect('selectedStoryView', this.store.select(selectStoryView));
  }

  public trackByIndex(index: number) {
    return index;
  }

  public get getCurrentViewTranslation() {
    const index = this.storyViewOptions.findIndex(
      (it) => it.id === this.state.get('selectedStoryView')
    );

    if (index !== -1) {
      return this.storyViewOptions[index].translation;
    }

    return '';
  }

  public selectStoryView(id: StoryView) {
    this.dropdownState = false;
    this.store.dispatch(
      StoryDetailActions.updateStoryViewMode({
        storyView: id,
        previousStoryView: this.state.get('selectedStoryView'),
      })
    );

    // reset state to prevent focus on navigation arrows
    this.location.replaceState(this.location.path(), undefined, {});
  }

  public displayHint() {
    this.showCopyLinkHintTimeout = setTimeout(() => {
      this.hintShown = true;
      this.cd.detectChanges();
    }, 200);
  }

  public resetCopyLink(type: 'fast' | 'slow') {
    if (this.showCopyLinkHintTimeout) {
      clearTimeout(this.showCopyLinkHintTimeout);
    }

    if (this.linkCopied) {
      const time = type === 'fast' ? 200 : 4000;
      this.resetCopyLinkTimeout = setTimeout(() => {
        this.hintShown = false;
        this.linkCopied = false;
        this.cd.detectChanges();
      }, time);
    } else {
      this.hintShown = false;
    }
  }

  public getStoryLink() {
    this.clipboard.copy(window.location.href);

    this.linkCopied = true;
  }

  public navigateToNextStory(ref: number) {
    void this.router.navigate(
      [
        'project',
        this.state.get('project').id,
        this.state.get('project').slug,
        'stories',
        ref,
      ],
      {
        state: {
          nextStoryNavigation: true,
        },
      }
    );
  }

  public navigateToPreviousStory(ref: number) {
    void this.router.navigate(
      [
        'project',
        this.state.get('project').id,
        this.state.get('project').slug,
        'stories',
        ref,
      ],
      {
        state: {
          previousStoryNavigation: true,
        },
      }
    );
  }

  public deleteStoryConfirmModal() {
    this.storyOptionsState = false;
    this.showDeleteStoryConfirm.next();
  }
}
