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
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '~/app/services/language/language.service';
import { Store } from '@ngrx/store';
import { ProjectApiService } from '@taiga/api';
import { RxState } from '@rx-angular/state';
import { Project, Story } from '@taiga/data';
import { EditorImageUploadService } from './editor-image-upload.service';
import { filterFalsy } from '../utils/operators/filter-falsy';

interface EditorState {
  project: Project;
  story: Story;
  editorFocused: boolean;
  ready: boolean;
  lan: {
    url: string;
    code: string;
  };
}

@Component({
  selector: 'tg-editor',
  standalone: true,
  imports: [CommonModule, EditorModule, FormsModule, ReactiveFormsModule],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    RxState,
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
  ],
})
export class EditorComponent {
  @Input({ required: true })
  public field!: string | null;

  @Input()
  public height = 200;

  @Output()
  public contentChange = new EventEmitter<string>();

  @Output()
  public focusChange = new EventEmitter<boolean>();

  @Output()
  public editorReady = new EventEmitter<void>();

  @HostBinding('class.editor-focused')
  public get editorFocused() {
    return this.state.get('editorFocused');
  }

  public state = inject<RxState<EditorState>>(RxState);
  public languageService = inject(LanguageService);
  public store = inject(Store);
  public projectApiService = inject(ProjectApiService);
  public editorImageUploadService = inject(EditorImageUploadService);
  public model$ = this.state.select();

  constructor() {
    this.state.connect('lan', this.languageService.getEditorLanguage());

    this.state.hold(this.state.select('editorFocused'), (focus) => {
      this.focusChange.next(focus);
    });

    this.state.hold(this.state.select('ready').pipe(filterFalsy()), () => {
      this.editorReady.next();
    });
  }

  public onFocus() {
    this.state.set({ editorFocused: true });
  }

  public onBlur() {
    this.state.set({ editorFocused: false });
  }

  public ready() {
    this.state.set({ ready: true });
  }
}
