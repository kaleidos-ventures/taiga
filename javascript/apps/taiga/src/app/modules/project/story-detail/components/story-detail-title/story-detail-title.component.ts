/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
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
import {
  HasChanges,
  HasChangesService,
} from '~/app/shared/utils/has-changes.service';
import { StoryDetail } from '@taiga/data';
import { auditTime } from 'rxjs';

export interface StoryDetailTitleState {
  story: StoryDetail;
  editedStory: StoryDetail;
  conflict: boolean;
  edit: boolean;
}

@UntilDestroy()
@Component({
  selector: 'tg-story-detail-title',
  templateUrl: './story-detail-title.component.html',
  styleUrls: ['./story-detail-title.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class StoryDetailTitleComponent implements OnChanges, HasChanges {
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

  @Input()
  public set story(story: StoryDetail) {
    this.state.set({ story });
  }

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
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
    private hasChangesService: HasChangesService,
    private state: RxState<StoryDetailTitleState>,
    private shortcutsService: ShortcutsService,
    private cd: ChangeDetectorRef
  ) {
    this.hasChangesService.addComponent(this);

    this.shortcutsService
      .task('edit-field.close')
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
  }

  public editTitle() {
    this.reset();

    this.state.set({ editedStory: this.state.get('story') });

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
      this.state.get('story').version !== this.state.get('editedStory').version;

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
    }
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
    }
  }
}
