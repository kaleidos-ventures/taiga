/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import {
  TuiButtonComponent,
  TuiNotification,
  TuiScrollbarComponent,
} from '@taiga-ui/core';
import {
  Membership,
  Project,
  Role,
  Status,
  Story,
  StoryDetail,
  StoryUpdate,
  StoryView,
  User,
  UserComment,
  Workflow,
} from '@taiga/data';
import { map, merge, pairwise, startWith, take } from 'rxjs';

import { v4 } from 'uuid';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { AppService } from '~/app/services/app.service';
import { PermissionsService } from '~/app/services/permissions.service';
import { WsService } from '~/app/services/ws';
import { OrderComments } from '~/app/shared/comments/comments.component';
import { EditorImageUploadService } from '~/app/shared/editor/editor-image-upload.service';
import { PermissionUpdateNotificationService } from '~/app/shared/permission-update-notification/permission-update-notification.service';
import { ResizedDirective } from '~/app/shared/resize/resize.directive';
import { filterNil } from '~/app/shared/utils/operators';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from './data-access/+state/actions/story-detail.actions';
import { storyDetailFeature } from './data-access/+state/reducers/story-detail.reducer';
import {
  selectLoadingWorkflow,
  selectStory,
  selectStoryView,
  selectWorkflow,
} from './data-access/+state/selectors/story-detail.selectors';
import { StoryDetaiImageUploadService } from './story-detail-image-upload.service';

export interface StoryDetailState {
  project: Project;
  story: StoryDetail;
  selectedStoryView: StoryView;
  updateStoryView: boolean;
  storyDateDistance: string;
  statuses: Status[];
  loadingStatuses: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canComment: boolean;
  fieldFocus: boolean;
  fieldEdit: boolean;
  showDiscardChangesModal: boolean;
  comments: UserComment[] | null;
  totalComments: number | null;
  activeComments: number | null;
  commentsOrder: OrderComments;
  commentsLoading: boolean;
  user: User;
}

export interface StoryDetailForm {
  title: FormControl<StoryDetail['title']>;
  status: FormControl<StoryDetail['status']['name']>;
  description: FormControl<StoryDetail['description']>;
}

@UntilDestroy()
@Component({
  selector: 'tg-story-detail',
  templateUrl: './story-detail.component.html',
  styleUrls: ['./story-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'story',
    },
    {
      provide: EditorImageUploadService,
      useClass: StoryDetaiImageUploadService,
    },
  ],
  hostDirectives: [
    {
      directive: ResizedDirective,
    },
  ],
})
export class StoryDetailComponent {
  @Input()
  public sidebarOpen = true;

  @ViewChild('nextStory') public nextStory!: TuiButtonComponent;

  @ViewChild('previousStory') public previousStory!: TuiButtonComponent;

  @ViewChild(TuiScrollbarComponent, { read: ElementRef })
  private scrollBar?: ElementRef<HTMLElement>;

  @Output()
  public toggleSidebar = new EventEmitter<void>();

  @ViewChild('storyRef') public set storyRefElementRef(elm: ElementRef) {
    if (elm && this.storyRef !== elm) {
      this.storyRef = elm;

      // taiga ui in the modal has a focus trap that makes the focus on the element, so we need to delay the focus one tick
      requestAnimationFrame(() => {
        this.setInitilFocus();
      });
    }
  }

  @HostListener('window:popstate')
  public onPopState() {
    this.closeStory();
  }

  public storyRef!: ElementRef;
  public collapsedSet = false;
  public linkCopied = false;
  public dropdownState = false;
  public storyOptionsState = false;
  public showDeleteStoryConfirm = false;
  public hintShown = false;
  public columnHeight = 0;
  public storyHeight = 0;
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
  public resetCopyLinkTimeout?: ReturnType<typeof setTimeout>;
  public showCopyLinkHintTimeout?: ReturnType<typeof setTimeout>;
  public form: FormGroup<StoryDetailForm> | null = null;

  public model$ = this.state.select();
  public project$ = this.store.select(selectCurrentProject);

  public get getCurrentViewTranslation() {
    const index = this.storyViewOptions.findIndex(
      (it) => it.id === this.state.get('selectedStoryView')
    );

    if (index !== -1) {
      return this.storyViewOptions[index].translation;
    }

    return '';
  }

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store,
    private clipboard: Clipboard,
    private location: Location,
    private permissionService: PermissionsService,
    private wsService: WsService,
    private state: RxState<StoryDetailState>,
    private appService: AppService,
    private router: Router,
    private permissionUpdateNotificationService: PermissionUpdateNotificationService,
    private resizedDirective: ResizedDirective
  ) {
    this.state.hold(this.resizedDirective.resized, () => {
      this.setHeights();
      this.cd.detectChanges();
    });

    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );
    this.state.connect(
      'story',
      this.store.select(selectStory).pipe(filterNil())
    );
    this.state.connect('selectedStoryView', this.store.select(selectStoryView));
    this.state.connect(
      'loadingStatuses',
      this.store.select(selectLoadingWorkflow)
    );

    this.state.connect(
      'statuses',
      this.store.select(selectWorkflow).pipe(
        filterNil(),
        map((workflow) => workflow.statuses),
        startWith([])
      )
    );
    this.state.connect(
      'canEdit',
      this.permissionService.hasPermissions$('story', ['modify'])
    );
    this.state.connect(
      'canDelete',
      this.permissionService.hasPermissions$('story', ['delete'])
    );
    this.state.connect(
      'canComment',
      this.permissionService.hasPermissions$('story', ['comment'])
    );
    this.state.connect(
      'comments',
      this.store.select(storyDetailFeature.selectComments)
    );
    this.state.connect(
      'totalComments',
      this.store.select(storyDetailFeature.selectTotalComments)
    );
    this.state.connect(
      'activeComments',
      this.store.select(storyDetailFeature.selectActiveComments)
    );
    this.state.connect(
      'commentsOrder',
      this.store.select(storyDetailFeature.selectCommentsOrder)
    );
    this.state.connect(
      'commentsLoading',
      this.store.select(storyDetailFeature.selectLoadingComments)
    );

    this.state
      .select('story')
      .pipe(filterNil(), take(1))
      .subscribe(() => {
        this.initStory();
      });

    this.state.connect('user', this.store.select(selectUser).pipe(filterNil()));

    this.events();
  }

  public setHeights() {
    const selectedStoryView = this.state.get('selectedStoryView');
    const viewportHeight = window.innerHeight;
    const headerHeight = 48;
    const storyHeaderHeight = 32;
    const modalpadding = 112;
    const headerMargin = 16;

    if (selectedStoryView === 'modal-view') {
      this.storyHeight = viewportHeight - modalpadding - headerMargin;
      this.columnHeight = this.storyHeight - storyHeaderHeight;
    } else {
      this.storyHeight = viewportHeight - headerHeight - headerMargin;
      this.columnHeight = this.storyHeight - storyHeaderHeight;
      this.storyHeight = viewportHeight - headerHeight - headerMargin;
    }
  }

  public getStoryUpdate(): StoryUpdate {
    const story: StoryUpdate = {
      ref: this.state.get('story').ref,
      version: this.state.get('story').version,
    };

    const form = this.form?.value;

    if (form) {
      const status = this.state
        .get('statuses')
        .find((status) => status.name === form.status);

      if (status && this.state.get('story').status.id !== status.id) {
        story.status = status.id;
      }

      if (this.state.get('story').title !== form.title) {
        story.title = form.title;
      }

      if (this.state.get('story').description !== form.description) {
        story.description = form.description;
      }
    }

    return story;
  }

  public initStory() {
    this.state.set({ fieldFocus: false, fieldEdit: false });

    const story = this.state.get('story');

    this.form = new FormGroup<StoryDetailForm>({
      title: new FormControl(story.title, { nonNullable: true }),
      status: new FormControl(story.status.name, { nonNullable: true }),
      description: new FormControl(story.description, { nonNullable: true }),
    });

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((form) => {
      const status = this.state
        .get('statuses')
        .find((status) => status.name === form.status);

      if (status) {
        const story = this.getStoryUpdate();
        const modifiedFields = Object.keys(story).filter((field) => {
          return !['ref', 'version'].includes(field);
        });

        if (modifiedFields.length) {
          this.store.dispatch(
            StoryDetailActions.updateStory({
              projectId: this.state.get('project').id,
              story,
            })
          );
        }
      }
    });

    this.state.hold(this.state.select('story'), () => {
      this.fillForm();
    });

    this.state.hold(this.state.select('canDelete'), (canDeletePermission) => {
      if (!canDeletePermission && this.showDeleteStoryConfirm) {
        this.closeDeleteStoryConfirmModal();
      }
    });
    this.setHeights();
  }

  public fillForm() {
    const story = this.state.get('story');

    if (this.form) {
      this.form.patchValue(
        {
          status: story.status.name,
          title: story.title,
          description: story.description,
        },
        { emitEvent: false, onlySelf: true }
      );
    }
  }

  public trackByIndex(index: number) {
    return index;
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

  public getStoryLink() {
    this.clipboard.copy(window.location.href);

    this.linkCopied = true;
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

  public closeStory() {
    const ref = this.state.get('story').ref;

    this.store.dispatch(StoryDetailActions.leaveStoryDetail());
    void this.router.navigateByUrl(
      `project/${this.state.get('project').id}/${
        this.state.get('project').slug
      }/kanban`,
      {
        state: {
          ignoreNextMainFocus: true,
        },
      }
    );
    if (ref) {
      requestAnimationFrame(() => {
        const mainFocus = document.querySelector(
          `tg-kanban-story[data-ref='${ref}'] .story-kanban-ref-focus .story-title`
        );

        if (mainFocus) {
          (mainFocus as HTMLElement).focus();
        }
      });
    }
  }

  public setInitilFocus() {
    const locationState = this.location.getState() as null | {
      nextStoryNavigation?: boolean;
      previousStoryNavigation?: boolean;
    };

    if (locationState?.nextStoryNavigation) {
      this.nextStory.nativeFocusableElement?.focus();
    } else if (locationState?.previousStoryNavigation) {
      this.previousStory.nativeFocusableElement?.focus();
    } else {
      (this.storyRef.nativeElement as HTMLElement).focus();
    }
  }

  public closeDeleteStoryConfirmModal() {
    this.showDeleteStoryConfirm = false;
  }

  public deleteStoryConfirmModal() {
    this.storyOptionsState = false;
    this.showDeleteStoryConfirm = true;
  }

  public deleteStory() {
    this.store.dispatch(
      StoryDetailActions.deleteStory({
        ref: this.state.get('story').ref,
        project: this.state.get('project'),
      })
    );
  }

  public fieldFocus(focus: boolean) {
    this.state.set({ fieldFocus: focus });
  }

  public fieldEdit(edit: boolean) {
    this.state.set({ fieldEdit: edit });
  }

  public discard() {
    this.state.set({ showDiscardChangesModal: false });

    this.closeStory();
  }

  public keepEditing() {
    this.state.set({ showDiscardChangesModal: false });
  }

  public changeCommentsOrder(order: OrderComments) {
    this.store.dispatch(
      StoryDetailActions.changeOrderComments({
        order,
        storyRef: this.state.get('story').ref,
        projectId: this.state.get('project').id,
      })
    );
  }

  public onComment(comment: string) {
    this.store
      .select(selectUser)
      .pipe(take(1), filterNil())
      .subscribe((user) => {
        this.store.dispatch(
          StoryDetailActions.newComment({
            tmpId: v4(),
            storyRef: this.state.get('story').ref,
            projectId: this.state.get('project').id,
            comment,
            user,
          })
        );
      });
  }

  public deleteComment(commentId: string): void {
    this.store.dispatch(
      StoryDetailActions.deleteComment({
        commentId: commentId,
        projectId: this.state.get('project').id,
        storyRef: this.state.get('story').ref,
        deletedBy: {
          username: this.state.get('user').username,
          fullName: this.state.get('user').fullName,
        },
      })
    );
  }

  public editComment(comment: Pick<UserComment, 'text' | 'id'>): void {
    this.store.dispatch(
      StoryDetailActions.editComment({
        commentId: comment.id,
        text: comment.text,
        projectId: this.state.get('project').id,
        storyRef: this.state.get('story').ref,
      })
    );
  }

  private events() {
    this.wsService
      .projectEvents<{ ref: Story['ref']; deletedBy: Partial<User> }>(
        'stories.delete'
      )
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        this.appService.toastNotification({
          message: 'delete.confirm_delete_event',
          paramsMessage: {
            ref: msg.event.content.ref,
            username: msg.event.content.deletedBy.fullName,
          },
          status: TuiNotification.Error,
          scope: 'story',
          closeOnNavigation: false,
        });
        if (this.state.get('selectedStoryView') == 'full-view') {
          void this.router.navigate([
            `/project/${this.state.get('project').id}/${
              this.state.get('project').slug
            }/kanban`,
          ]);
        } else {
          const next = this.state.get('story').next?.ref;
          const prev = this.state.get('story').next?.ref;
          this.closeStory();

          if (!next && !prev) {
            const workflowSlug = this.state.get('story').workflow.slug;
            if (workflowSlug) {
              requestAnimationFrame(() => {
                const mainFocus = document.querySelector(
                  `tg-kanban-status[data-slug='${workflowSlug}']`
                );
                if (mainFocus) {
                  (mainFocus as HTMLElement).focus();
                }
              });
            }
          }
        }
      });

    merge(
      this.wsService.projectEvents<Role>('projectroles.update'),
      this.wsService.userEvents<{ membership: Membership }>(
        'projectmemberships.update'
      )
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (this.state.get('selectedStoryView') === 'full-view') {
          this.project$
            .pipe(filterNil(), pairwise(), take(1))
            .subscribe(([prev, next]) => {
              this.permissionUpdateNotificationService.notifyLosePermissions(
                prev,
                next
              );
            });
        }
      });

    this.wsService
      .projectEvents<{
        workflowStatus: Status & { workflow: Workflow };
        moveToSlug: Status['id'];
      }>('workflowstatuses.delete')
      .pipe(untilDestroyed(this))
      .subscribe((eventResponse) => {
        const content = eventResponse.event.content;
        const story = this.state.get('story');
        if (
          story.status.id === content.workflowStatus.id &&
          !content.moveToSlug
        ) {
          this.store.dispatch(
            StoryDetailApiActions.deleteStorySuccess({
              project: this.state.get('project'),
              ref: story.ref,
            })
          );
        }
      });
  }
}
