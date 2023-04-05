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
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, StoryDetail } from '@taiga/data';
import { map } from 'rxjs';
import { StoryDetailForm } from '~/app/modules/project/story-detail/story-detail.component';
import { PermissionsService } from '~/app/services/permissions.service';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import {
  HasChanges,
  HasChangesService,
} from '~/app/shared/utils/has-changes.service';
import { filterNil } from '~/app/shared/utils/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { LanguageService } from '~/app/services/language/language.service';

export interface StoryDetailDescriptionState {
  projectId: Project['id'];
  story: StoryDetail;
  editedStory: StoryDetail;
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
export class StoryDetailDescriptionComponent
  implements OnChanges, HasChanges, OnDestroy
{
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

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
  }

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
    private hasChangesService: HasChangesService,
    private hasPermissions: PermissionsService,
    private store: Store,
    private localStorageService: LocalStorageService,
    private languageService: LanguageService
  ) {
    this.hasChangesService.addComponent(this);

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
  }

  public editDescription() {
    this.reset();

    this.state.set({ editedStory: this.state.get('story') });

    this.setEdit(true);
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
      this.state.get('story').version !== this.state.get('editedStory').version;

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
      }>(key) ?? null;

    if (obj && obj.edit) {
      this.setDescription(obj.value);
      this.state.set({ editedStory: this.state.get('story') });
      this.setEdit(true);
    }
  }

  private saveState() {
    const key = this.getLocalStorageKey();

    if (this.state.get('edit')) {
      this.localStorageService.set(key, {
        edit: true,
        value: this.descriptionForm.get('description')!.value,
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
