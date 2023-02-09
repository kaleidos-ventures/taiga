/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiButtonModule,
  TuiLinkModule,
  TuiNotification,
} from '@taiga-ui/core';
import { EditProject, Project } from '@taiga/data';
import { ImageUploadModule } from '@taiga/ui/inputs/image-upload/image-upload.module';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { ModalModule } from '@taiga/ui/modal';
import { AppService } from '~/app/services/app.service';
import { DiscardChangesModalComponent } from '~/app/shared/discard-changes-modal/discard-changes-modal.component';

@Component({
  selector: 'tg-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputsModule,
    ImageUploadModule,
    FormsModule,
    TranslocoModule,
    TuiButtonModule,
    TuiLinkModule,
    ModalModule,
    TuiAutoFocusModule,
    DiscardChangesModalComponent,
  ],
})
export class EditProjectComponent implements OnInit {
  @Input()
  public project!: Project;

  @Output()
  public closeModal = new EventEmitter<void>();

  @Output()
  public submitProject = new EventEmitter<EditProject>();

  @Input()
  public set show(show: boolean) {
    this.showEditProjectModal = show;

    if (show) {
      this.showConfirmEditProjectModal = false;
    }
  }

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.hasChanges();
  }

  public showConfirmEditProjectModal = false;
  public showEditProjectModal = false;

  public form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    description: new FormControl('', {
      validators: Validators.maxLength(200),
    }),
    logo: new FormControl<string | null>(null),
  });

  public get logo() {
    return this.form.get('logo') as FormControl;
  }

  constructor(public appService: AppService) {}

  public ngOnInit(): void {
    this.fillForm(this.project);
  }

  public fillForm(project: Project) {
    this.form.patchValue({
      ...project,
      description: project.description ?? '',
      logo: null,
    });
  }

  public submit() {
    if (!this.project.userIsAdmin) {
      this.appService.toastNotification({
        message: 'errors.admin_permission',
        status: TuiNotification.Error,
      });

      this.closeModal.next();
    } else if (this.form.valid) {
      const data = {
        id: this.project.id,
        ...this.form.value,
      };

      // null == hasn't changed
      // '' == deleted
      if (data.logo === null) {
        delete data.logo;
      }

      this.submitProject.next(data as EditProject);
    }
  }

  public keepEditing() {
    this.showConfirmEditProjectModal = false;
    this.showEditProjectModal = true;
  }

  public discard() {
    this.form.reset();
    this.closeModal.next();
  }

  public close() {
    if (this.hasChanges()) {
      this.showConfirmEditProjectModal = true;
      this.showEditProjectModal = false;
    } else {
      this.closeModal.next();
    }
  }

  private hasChanges() {
    const projectDescription = this.project.description ?? '';
    if (
      this.form.value.name !== this.project.name ||
      this.form.value.description !== projectDescription
    ) {
      return true;
    }
    return this.form.get('logo')!.dirty;
  }
}
