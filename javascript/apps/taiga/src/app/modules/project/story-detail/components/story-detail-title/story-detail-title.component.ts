/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import { ShortcutsService } from '@taiga/core';
import { StoryDetailForm } from '~/app/modules/project/story-detail/story-detail.component';
import {
  StoryTitleMaxLength,
  StoryTitleValidation,
} from '~/app/shared/story/title-validation';
import { Project, StoryDetail } from '@taiga/data';
import { auditTime, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { PermissionsService } from '~/app/services/permissions.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { Store } from '@ngrx/store';
import { filterNil } from '~/app/shared/utils/operators';

export interface StoryDetailTitleState {
  projectId: Project['id'];
  story: StoryDetail;
  editedStory: StoryDetail['version'];
  conflict: boolean;
  edit: boolean;
  hasPermissionToEdit: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-story-detail-title',
  templateUrl: './story-detail-title.component.html',
  styleUrls: ['./story-detail-title.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class StoryDetailTitleComponent implements OnChanges, OnDestroy {
  @Input()
  public form!: FormGroup<StoryDetailForm>;

  @Output()
  public editChange = new EventEmitter<boolean>();

  @Output()
  public focusChange = new EventEmitter<boolean>();

  @HostBinding('class.conflict')
  public get conflict() {
    return this.state.get('conflict');
  }

  @HostBinding('class.edit')
  public get edit() {
    return this.state.get('edit');
  }

  @HostBinding('class.has-permission-to-edit')
  public get hasPermissionToEdit() {
    return this.state.get('hasPermissionToEdit');
  }

  @Input()
  public set story(story: StoryDetail) {
    if (
      this.state.get('story')?.ref &&
      this.state.get('story')?.ref !== story.ref
    ) {
      this.saveState();
    }

    this.state.set({ story });
  }

  public titleForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: StoryTitleValidation,
    }),
  });

  public model$ = this.state.select();
  public showConfirmEditTitleModal = false;
  public maxLength = StoryTitleMaxLength;

  constructor(
    private state: RxState<StoryDetailTitleState>,
    private shortcutsService: ShortcutsService,
    private cd: ChangeDetectorRef,
    private hasPermissions: PermissionsService,
    private store: Store,
    private localStorageService: LocalStorageService
  ) {
    this.state.connect(
      'projectId',
      this.store.select(selectCurrentProject).pipe(
        filterNil(),
        map((project) => project.id)
      )
    );

    this.shortcutsService
      .task('cancel', {}, 'edit-field')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.cancelEditTitle();
        this.cd.detectChanges();
      });

    this.titleForm
      .get('title')
      ?.valueChanges.pipe(auditTime(200), untilDestroyed(this))
      .subscribe((title) => {
        const titleWithoutBreakLines = title.replace(/(\r\n|\n|\r)/gm, ' ');

        if (title !== titleWithoutBreakLines) {
          this.titleForm.get('title')?.setValue(titleWithoutBreakLines);
        }
      });

    this.state.connect(
      'hasPermissionToEdit',
      this.hasPermissions.hasPermissions$('story', ['modify'])
    );

    this.state.hold(this.state.select('hasPermissionToEdit'), () => {
      if (this.state.get('edit')) {
        this.discard();
      }
    });

    this.state.hold(
      this.titleForm
        .get('title')!
        .valueChanges.pipe(distinctUntilChanged(), debounceTime(500)),
      () => {
        this.saveState();
      }
    );
  }

  public editTitle() {
    this.reset();

    this.state.set({ editedStory: this.state.get('story').version });

    this.setEdit(true);
  }

  public cancelEditTitle() {
    if (this.hasChanges()) {
      this.showConfirmEditTitleModal = true;
    } else {
      this.setEdit(false);
    }
  }

  public save() {
    const newVersion =
      this.state.get('story').version !== this.state.get('editedStory');

    if (newVersion && this.hasChanges()) {
      this.setConflict(true);
    } else if (this.titleForm.valid) {
      this.setEdit(false);
      this.form.get('title')?.setValue(this.titleForm.get('title')!.value);
    }
  }

  public discard() {
    this.showConfirmEditTitleModal = false;

    this.reset();
    this.setEdit(false);
  }

  public keepEditing() {
    this.showConfirmEditTitleModal = false;
  }

  public onEnter(event: Event) {
    event.preventDefault();
    this.save();
  }

  public setConflict(conflict: boolean) {
    const oldConflict = this.state.get('conflict');

    if (oldConflict !== conflict) {
      this.state.set({ conflict });

      this.focusChange.next(conflict);
    }
  }

  public hasChanges() {
    return this.state.get('story').title !== this.titleForm.get('title')!.value;
  }

  public cancelConflict(hasBeenCopied: boolean) {
    this.setConflict(false);

    if (hasBeenCopied) {
      this.setEdit(false);
    }
  }

  public acceptConflict() {
    this.setConflict(false);
    this.setEdit(false);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.form) {
      this.titleForm
        .get('title')!
        .setValue(this.form.get('title')?.value ?? '');

      this.setInitialState();
    }
  }

  public ngOnDestroy() {
    this.saveState();
  }

  private getLocalStorageKey() {
    const projectId = this.state.get('projectId');
    const storyRef = this.state.get('story').ref;

    return `${projectId}-story${storyRef}-title`;
  }

  private setInitialState() {
    const key = this.getLocalStorageKey();
    const obj =
      this.localStorageService.get<{
        edit: boolean;
        value: string;
        version: number;
      }>(key) ?? null;

    if (obj && obj.edit) {
      this.titleForm.get('title')!.setValue(obj.value);
      this.state.set({ editedStory: obj.version });
      this.setEdit(true);
    }
  }

  private saveState() {
    const key = this.getLocalStorageKey();

    if (this.state.get('edit')) {
      this.localStorageService.set(key, {
        edit: true,
        value: this.titleForm.get('title')!.value,
        version: this.state.get('editedStory'),
      });
    } else {
      this.removeLocalState();
    }
  }

  private removeLocalState() {
    const key = this.getLocalStorageKey();
    this.localStorageService.remove(key);
  }
  private reset() {
    this.setConflict(false);
    this.titleForm.get('title')!.setValue(this.form.get('title')!.value ?? '');
  }

  private setEdit(edit: boolean) {
    this.state.set({ edit });

    this.editChange.next(edit);

    if (edit) {
      this.shortcutsService.setScope('edit-field');
    } else {
      this.shortcutsService.undoScope('edit-field');
      this.focusChange.next(false);
      this.removeLocalState();
    }
  }
}
