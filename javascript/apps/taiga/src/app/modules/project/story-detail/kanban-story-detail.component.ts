/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { A11yModule } from '@angular/cdk/a11y';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
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
  differenceInDays,
  differenceInSeconds,
  differenceInYears,
  format,
  formatDistanceToNow,
  parseISO,
} from 'date-fns';
import { map } from 'rxjs';
import {
  clearStory,
  updatedStoryViewMode,
  updateStoryViewMode,
} from '~/app/modules/project/data-access/+state/actions/project.actions';
import {
  selectCurrentProject,
  selectCurrentStory,
  selectStoryView,
  selectUpdateStoryView,
} from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { DropdownModule } from '~/app/shared/dropdown/dropdown.module';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { filterNil } from '~/app/shared/utils/operators';

@UntilDestroy()
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
    A11yModule,
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
export class KanbanStoryDetailComponent implements AfterViewInit {
  @Input()
  public sidebarOpen = false;

  @ViewChild('storyRef') public storyRef!: ElementRef;

  @Output()
  public toggleSidebar = new EventEmitter<void>();

  public collapsedSet = false;
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

  public model$ = this.state.select().pipe(
    map((state) => {
      if (state.story) {
        state.storyDateDistance = this.getStoryDateDistance(state.story);
      }
      return {
        ...state,
      };
    })
  );

  public get getCurrentViewTranslation() {
    const index = this.storyViewOptions.findIndex(
      (it) => it.id === this.state.get('selectedStoryView')
    );

    if (index !== -1) {
      return this.translocoService.translate(
        this.storyViewOptions[index].translation
      );
    }

    return '';
  }

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store,
    private clipboard: Clipboard,
    private location: Location,
    private translocoService: TranslocoService,
    private state: RxState<{
      project: Project;
      story: StoryDetail;
      selectedStoryView: StoryView;
      updateStoryView: boolean;
      storyDateDistance: string;
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
    this.state.connect(
      'updateStoryView',
      this.store.select(selectUpdateStoryView)
    );

    this.state.hold(this.state.select('updateStoryView'), (updated) => {
      if (updated) {
        setTimeout(() => {
          const mainFocus = document.querySelector('.story-detail-focus');
          if (mainFocus) {
            (mainFocus as HTMLElement).focus();
          }
          this.store.dispatch(updatedStoryViewMode());
        }, 200);
      }
    });
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

  public resetCopyLink() {
    setTimeout(() => {
      this.linkCopied = false;
      this.cd.detectChanges();
    }, 1000);
  }

  public navigateToStory(ref: number | null) {
    if (ref) {
      this.location.go(
        `project/${this.state.get('project').slug}/stories/${ref}`
      );
    }
  }

  public closeStory(ref: number | undefined) {
    this.store.dispatch(clearStory());
    this.location.replaceState(
      `project/${this.state.get('project').slug}/kanban`
    );
    if (ref) {
      setTimeout(() => {
        const mainFocus = document.querySelector(
          `tg-kanban-story[data-ref='${ref}'] .story-kanban-ref-focus`
        );
        if (mainFocus) {
          (mainFocus as HTMLElement).focus();
        }
      }, 200);
    }
  }

  public ngAfterViewInit(): void {
    const locationState = this.location.getState() as null | {
      fromCard?: boolean;
    };

    // click came from a story card
    if (locationState?.fromCard) {
      (this.storyRef.nativeElement as HTMLElement).focus();
    }
  }

  public getStoryDateDistance(story: StoryDetail) {
    const createdAt = parseISO(story.createdAt);
    const secondsDistance = Math.abs(
      differenceInSeconds(createdAt, new Date())
    );
    const daysDistance = Math.abs(differenceInDays(createdAt, new Date()));
    const yearsDistance = Math.abs(differenceInYears(createdAt, new Date()));

    // Less than 60 sec -> now
    // between 60 sec and 6 days -> about {relativeTime} ago
    // between 6 days and 1 year -> MONTH DAY
    // More than 1 year -> MONTH DAY YEAR

    if (!yearsDistance) {
      if (daysDistance > 6) {
        return format(createdAt, 'MMM d');
      } else {
        if (secondsDistance <= 60) {
          return this.translocoService.translate('kanban.story_detail.now');
        }
        const distance = formatDistanceToNow(createdAt);
        const agoString = this.translocoService.translate(
          'kanban.story_detail.ago'
        );
        return `${distance} ${agoString}`;
      }
    } else {
      return format(createdAt, 'MMM d yyyy');
    }
  }
}
