/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  TuiButtonModule,
  TuiDataListModule,
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, StoryDetail, StoryView } from '@taiga/data';
import {
  clearStory,
  fetchStory,
  updateStoryViewMode,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentStory,
  selectStoryView,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { filterNil } from '~/app/shared/utils/operators';
@Component({
  selector: 'tg-kanban-story-detail',
  standalone: true,
  templateUrl: './kanban-story-detail.component.html',
  styleUrls: ['./kanban-story-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    TuiButtonModule,
    TuiHintModule,
    TuiLinkModule,
    TuiScrollbarModule,
    DropdownModule,
    TuiDataListModule,
    TuiSvgModule,
    UserAvatarComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'kanban',
        alias: 'kanban',
      },
    },
  ],
})
export class KanbanStoryDetailComponent implements OnChanges {
  @Input()
  public isCollapsed = false;

  @Output()
  public closeButton = new EventEmitter();

  public collapsedAlreadyForced = false;
  public forceCollapsed = false;
  public linkCopied = false;
  public dropdownState = false;
  public storyViewOptions: { id: StoryView; translation: string }[] = [
    {
      id: 'modal-view',
      translation: 'kanban.story_detail.modal_view',
    },
    {
      id: 'side-view',
      translation: 'kanban.story_detail.side_panel_view',
    },
    {
      id: 'full-view',
      translation: 'kanban.story_detail.full_width_view',
    },
  ];
  public sidebarOpen = LocalStorageService.get('story_view_sidebar') || false;
  public model$ = this.state.select();

  public get getCurrentViewTranslation() {
    const index = this.storyViewOptions.findIndex(
      (it) => it.id === this.state.get('selectedStoryView')
    );
    return this.translocoService.translate(
      this.storyViewOptions[index].translation
    );
  }

  constructor(
    private store: Store,
    private clipboard: Clipboard,
    private localStorage: LocalStorageService,
    private location: Location,
    private translocoService: TranslocoService,
    private state: RxState<{
      project: Project;
      story: StoryDetail;
      selectedStoryView: StoryView;
    }>
  ) {
    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'story',
      this.store.select(selectCurrentStory).pipe(filterNil())
    );
    this.state.connect('selectedStoryView', this.store.select(selectStoryView));
  }
  public ngOnChanges(): void {
    if (!this.collapsedAlreadyForced && this.isCollapsed) {
      this.collapsedAlreadyForced = true;
      this.forceCollapsed = true;
      this.sidebarOpen = false;
    }
  }

  public trackByIndex(index: number) {
    return index;
  }

  public selectStoryView(id: StoryView) {
    this.dropdownState = false;
    this.store.dispatch(
      updateStoryViewMode({
        storyView: id,
        previousStoryView: this.state.get('selectedStoryView'),
      })
    );
  }

  public getStoryLink() {
    this.clipboard.copy(window.location.href);
    this.linkCopied = true;
  }

  public handleSidePanel() {
    this.forceCollapsed = false;
    this.localStorage.set('story_view_sidebar', !this.sidebarOpen);
    this.sidebarOpen = !this.sidebarOpen;
  }

  public resetCopyLink() {
    setTimeout(() => {
      this.linkCopied = false;
    }, 1000);
  }

  public navigateToStory(ref: number | null) {
    this.store.dispatch(
      fetchStory({
        projectSlug: this.state.get('project').slug,
        storyRef: ref!,
      })
    );
  }

  public closeStory() {
    this.store.dispatch(clearStory());
    this.location.replaceState(
      `project/${this.state.get('project').slug}/kanban`
    );
  }
}
