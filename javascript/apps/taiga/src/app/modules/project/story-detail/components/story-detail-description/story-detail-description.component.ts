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
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, StoryDetail } from '@taiga/data';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { StoryDetailForm } from '~/app/modules/project/story-detail/story-detail.component';
import { LanguageService } from '~/app/services/language/language.service';
import { PermissionsService } from '~/app/services/permissions.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { filterNil } from '~/app/shared/utils/operators';
import { ProjectApiService } from '@taiga/api';

export interface StoryDetailDescriptionState {
  projectId: Project['id'];
  story: StoryDetail;
  editedStory: StoryDetail['version'];
  conflict: boolean;
  edit: boolean;
  editorFocused: boolean;
  hasPermissionToEdit: boolean;
  editorReady: boolean;
  lan: {
    url: string;
    code: string;
  };
}

@Component({
  selector: 'tg-story-detail-description',
  templateUrl: './story-detail-description.component.html',
  styleUrls: ['./story-detail-description.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class StoryDetailDescriptionComponent implements OnChanges, OnDestroy {
  @ViewChild('descriptionContent')
  public descriptionContent!: ElementRef;

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

  @HostBinding('class.editor-focused')
  public get editorFocused() {
    return this.state.get('editorFocused');
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

  public descriptionHeight = 200;

  // https://github.com/tinymce/tinymce-angular/issues/311
  public description = '';

  public descriptionForm = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
    }),
  });

  public model$ = this.state.select();
  public showConfirmEditDescriptionModal = false;

  constructor(
    public state: RxState<StoryDetailDescriptionState>,
    private hasPermissions: PermissionsService,
    private store: Store,
    private localStorageService: LocalStorageService,
    private languageService: LanguageService,
    private projectApiService: ProjectApiService
  ) {
    this.state.connect(
      'hasPermissionToEdit',
      this.hasPermissions.hasPermissions$('story', ['modify'])
    );

    this.state.connect(
      'projectId',
      this.store.select(selectCurrentProject).pipe(
        filterNil(),
        map((project) => project.id)
      )
    );

    this.state.connect('lan', this.languageService.getEditorLanguage());

    this.state.hold(this.state.select('hasPermissionToEdit'), () => {
      if (this.state.get('edit')) {
        this.discard();
      }
    });

    this.state.hold(
      this.descriptionForm.get('description')!.valueChanges.pipe(
        filter((value) => value !== this.state.get('story').description),
        distinctUntilChanged(),
        debounceTime(500)
      ),
      () => {
        this.saveState();
      }
    );
  }

  public imageUploadHandler(blobInfo: {
    filename: () => string;
    blob: () => Blob;
  }): Promise<string> {
    const file = new File([blobInfo.blob()], blobInfo.filename());

    return new Promise((resolve) => {
      this.projectApiService
        .uploadStoriesMediafiles(
          this.state.get('projectId'),
          this.state.get('story').ref,
          [file]
        )
        .subscribe((result) => {
          resolve(result[0].file);
        });
    });
  }

  public setEditorInitialHeight() {
    const descriptionHeight = (
      this.descriptionContent.nativeElement as HTMLElement
    ).offsetHeight;
    const headerCompensation = 39;
    const actionCompensation = 32;
    const borderCompensation = 8;
    this.descriptionHeight =
      descriptionHeight +
      headerCompensation +
      actionCompensation +
      borderCompensation;
  }

  public editDescription() {
    if (this.state.get('hasPermissionToEdit')) {
      this.setEditorInitialHeight();
      this.reset();

      this.state.set({ editedStory: this.state.get('story').version });

      this.setEdit(true);
    }
  }

  public cancelEditDescription() {
    if (this.hasChanges()) {
      this.showConfirmEditDescriptionModal = true;
    } else {
      this.setEdit(false);
    }
  }

  public save() {
    this.descriptionForm.get('description')?.setValue(this.description);

    const newVersion =
      this.state.get('story').version !== this.state.get('editedStory');

    if (newVersion && this.hasChanges()) {
      this.setConflict(true);
    } else if (this.descriptionForm.valid) {
      this.setEdit(false);
      this.form
        .get('description')
        ?.setValue(this.descriptionForm.get('description')!.value);
    }
  }

  public discard() {
    this.showConfirmEditDescriptionModal = false;

    this.reset();
    this.setEdit(false);
  }

  public keepEditing() {
    this.showConfirmEditDescriptionModal = false;
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
    const currentDescription = this.state.get('story').description ?? '';

    return (
      currentDescription !== this.descriptionForm.get('description')!.value
    );
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

  public focusIn() {
    this.state.set({ editorFocused: true });
    this.focusChange.next(true);
  }

  public focusOut() {
    this.state.set({ editorFocused: false });
    this.focusChange.next(false);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.form) {
      this.setDescription(this.form.get('description')?.value ?? '');
      this.setInitialState();
    }
  }

  public onInitEditor() {
    this.state.set({ editorReady: true });
  }

  public ngOnDestroy() {
    this.saveState();
  }

  private reset() {
    this.setConflict(false);
    this.setDescription(this.form.get('description')!.value ?? '');
  }

  private getLocalStorageKey() {
    const projectId = this.state.get('projectId');
    const storyRef = this.state.get('story').ref;

    return `${projectId}-story${storyRef}-description`;
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
      this.setDescription(obj.value);
      this.state.set({ editedStory: obj.version });
      this.setEdit(true);
    }
  }

  private saveState() {
    const key = this.getLocalStorageKey();

    if (this.state.get('edit')) {
      this.localStorageService.set(key, {
        edit: true,
        value: this.descriptionForm.get('description')!.value,
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

  private setEdit(edit: boolean) {
    this.state.set({ edit });

    this.editChange.next(edit);

    if (!edit) {
      this.focusOut();
      this.state.set({ editorReady: false });
      this.removeLocalState();
    }
  }

  private setDescription(value: string) {
    this.descriptionForm.get('description')!.setValue(value);

    this.description = this.descriptionForm.get('description')!.value;
  }
}
