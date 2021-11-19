/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormControl } from '@ngneat/reactive-forms';
import { ProjectCreation, Workspace } from '@taiga/data';
import { ModalComponent } from '@taiga/ui/modal/components/modal.component';
import { RandomColorService } from '@taiga/ui/services/random-color/random-color.service';

export type TemplateProjectForm = Pick<ProjectCreation, 'name' | 'color' | 'description' | 'logo'>;

@Component({
  selector: 'tg-template-step',
  templateUrl: './template-step.component.html',
  styleUrls: ['../../styles/project.shared.css', './template-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateStepComponent implements OnInit {
  public templateProjectForm!: FormGroup;
  public showWarningModal = false;

  @Input()
  public initialForm?: TemplateProjectForm;

  @Input()
  public selectedWorkspaceSlug!: ProjectCreation['workspaceSlug'];

  @Input()
  public workspaces!: Workspace[];

  @ViewChild(ModalComponent)
  public modal!: ModalComponent;

  @Output()
  public projectData = new EventEmitter<ProjectCreation>();

  @Output()
  public cancel = new EventEmitter<undefined | TemplateProjectForm>();

  @HostListener('window:beforeunload')
  public unloadHandler(event: Event) {
    event.preventDefault();
  }

  constructor(private fb: FormBuilder) {}

  public ngOnInit() {
    this.initForm();
  }

  public initForm() {
    this.templateProjectForm = this.fb.group({
      workspace: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', Validators.maxLength(200)],
      color: [RandomColorService.randomColorPicker(), Validators.required],
      logo: [''],
    });

    if (this.initialForm) {
      this.templateProjectForm.patchValue(this.initialForm);
    }

    this.templateProjectForm.get('workspace')?.setValue(this.getCurrentWorkspace());
  }

  public getCurrentWorkspace() {
    return this.workspaces.find(
      (workspace) => workspace.slug === this.selectedWorkspaceSlug
    );
  }

  public get logo() {
    return this.templateProjectForm.get('logo') as FormControl;
  }

  public get workspace() {
    return this.templateProjectForm.get('workspace')?.value as Workspace;
  }

  public previousStep() {
    this.cancel.next({
      name: this.formValue.name,
      description: this.formValue.description,
      color: this.formValue.color,
      logo: this.formValue.logo,
    });
  }

  public get formValue() {
    return this.templateProjectForm.value as {
      workspace: Workspace;
      name: string;
      description: string;
      color: number;
      logo: File;
    };
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
      this.templateProjectForm.get('name')?.value,
      this.templateProjectForm.get('description')?.value,
      this.templateProjectForm.get('logo')?.value,
    ];

    return data.some(value => value);
  }

  public createProject() {
    (this.templateProjectForm.get('logo') as FormControl).setErrors(null);

    this.templateProjectForm.markAllAsTouched();
    if (this.templateProjectForm.valid) {
      const workspace = this.formValue.workspace;

      const projectFormValue: ProjectCreation = {
        workspaceSlug: workspace.slug,
        name: this.formValue.name,
        description: this.formValue.description,
        color: this.formValue.color,
        logo: this.formValue.logo,
      };
      this.projectData.next(projectFormValue);
    }
  }

  public acceptWarningClose() {
    this.showWarningModal = false;

    this.cancel.next();
  }
}
