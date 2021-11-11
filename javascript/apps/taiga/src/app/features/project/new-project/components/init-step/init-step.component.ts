/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { ProjectCreation, Workspace } from '@taiga/data';
import { Template } from '~/app/features/project/new-project/data/new-project.model';
import { Step } from '~/app/features/project/new-project/data/new-project.model';

@Component({
  selector: 'tg-init-step',
  templateUrl: './init-step.component.html',
  styleUrls: [
    '../../styles/project.shared.css',
    './init-step.component.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitStepComponent implements OnInit {

  @Input()
  public workspaces!: Workspace[];

  @Output()
  public templateSelected = new EventEmitter<{step: Step, slug: ProjectCreation['workspaceSlug']}>();

  public createProjectForm!: FormGroup;

  public templates: Template[] = [
    {
      nextStep: 'blank',
      icon: 'empty',
      title: this.translocoService.translate('new_project.first_step.blank_project'),
      description: this.translocoService.translate('new_project.first_step.blank_project_description'),
      action: () => this.initProject('blank'),
    },
    {
      nextStep: 'template',
      icon: 'template',
      title: this.translocoService.translate('new_project.first_step.template_project'),
      description: this.translocoService.translate('new_project.first_step.template_project_description'),
      action: () => this.initProject('template'),
    },
    {
      nextStep: 'import',
      icon: 'import',
      title: this.translocoService.translate('new_project.first_step.import_project'),
      description: this.translocoService.translate('new_project.first_step.import_project_description'),
      action: () => this.initProject('import'),
    },
    {
      nextStep: 'duplicate',
      icon: 'copy',
      title: this.translocoService.translate('new_project.first_step.duplicate_project'),
      description: this.translocoService.translate('new_project.first_step.duplicate_project_description'),
      tip: this.translocoService.translate('new_project.first_step.duplicate_project_tip'),
      action: () => this.initProject('duplicate'),
    }
  ];

  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit() {
    this.initForm();
    this.getParams();
  }

  public initForm() {
    this.createProjectForm = this.fb.group({
      workspace: [null, Validators.required],
    });
  }

  public getParams() {
    const slug = this.route.snapshot.queryParamMap.get('workspace');
    const refWorkspace = this.workspaces.filter((workspace) => workspace.slug === slug);
    if (refWorkspace.length) {
      this.createProjectForm.get('workspace')?.setValue(refWorkspace[0]);
    }
  }

  public trackByIndex(index: number) {
    return index;
  }

  public initProject(step: Step) {
    const workspace: Workspace = this.currentWorkspace.value as Workspace;
    if(this.createProjectForm.valid) {
      this.templateSelected.next({
        step,
        slug: workspace.slug
      });
    } else {
      this.createProjectForm.markAllAsTouched();
    }
  }

  public get currentWorkspace(): FormControl {
    return this.createProjectForm.get('workspace') as FormControl;
  }
}
