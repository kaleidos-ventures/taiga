/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectCreation, Workspace } from '@taiga/data';
import { ModalComponent } from '@taiga/ui/modal/components/modal.component';
import { RandomColorService } from '@taiga/ui/services/random-color/random-color.service';
@Component({
  selector: 'tg-detail-step',
  templateUrl: './detail-step.component.html',
  styleUrls: ['../../styles/project.shared.css', './detail-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailStepComponent implements OnInit {
  public detailProjectForm!: FormGroup;
  public showWarningModal = false;

  @Input()
  public selectedWorkspaceSlug!: ProjectCreation['workspaceSlug'];

  @Input()
  public workspaces!: Workspace[];

  @ViewChild(ModalComponent)
  public modal!: ModalComponent;

  @Output()
  public projectData = new EventEmitter<ProjectCreation>();

  @Output()
  public cancel = new EventEmitter<void>();

  @HostListener('window:beforeunload')
  public unloadHandler(event: Event) {
    event.preventDefault();
  }
  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.initForm();
  }

  public initForm() {
    this.detailProjectForm = this.fb.group({
      workspace: [this.getCurrentWorkspace(), Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.maxLength(140)],
      color: [RandomColorService.randomColorPicker(), Validators.required],
      logo: '',
    }, { updateOn: 'submit' });
  }

  public getCurrentWorkspace() {
    return this.workspaces.find(
      (workspace) => workspace.slug === this.selectedWorkspaceSlug
    );
  }

  public get workspace() {
    return this.detailProjectForm.get('workspace')?.value as Workspace;
  }

  public onAddProjectImage(image?: File) {
    if (image) {
      this.detailProjectForm.get('logo')?.setValue(image);
    } else {
      this.detailProjectForm.get('logo')?.setValue('');
    }
  }

  public cancelForm() {
    if (this.formHasContent()) {
      this.showWarningModal = true;
    } else {
      this.cancel.next();
    }
  }

  public formHasContent() {
    const data = [
      this.detailProjectForm.get('title')?.value,
      this.detailProjectForm.get('description')?.value,
      this.detailProjectForm.get('logo')?.value,
    ];

    return data.some(value => value);
  }

  public createProject() {
    this.detailProjectForm.markAllAsTouched();
    if (this.detailProjectForm.valid) {
      const workspace = this.detailProjectForm.get('workspace')
        ?.value as Workspace;
      const projectFormValue: ProjectCreation = {
        workspaceSlug: workspace.slug,
        name: this.detailProjectForm.get('title')?.value as string,
        description: this.detailProjectForm.get('description')?.value as string,
        color: this.detailProjectForm.get('color')?.value as number,
        logo: this.detailProjectForm.get('logo')?.value as File,
      };
      this.projectData.next(projectFormValue);
    }
  }

  public acceptWarningClose() {
    this.showWarningModal = false;

    this.cancel.next();
  }
}
