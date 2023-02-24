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
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { ProjectCreation, Workspace } from '@taiga/data';
import {
  Step,
  Template,
} from '~/app/modules/feature-new-project/data/new-project.model';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';

@Component({
  selector: 'tg-init-step',
  templateUrl: './init-step.component.html',
  styleUrls: ['../../styles/project.shared.css', './init-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitStepComponent implements OnInit, OnChanges {
  @Input()
  public selectedWorkspaceId!: ProjectCreation['workspaceId'];

  @Input()
  public workspaces!: Workspace[];

  @Output()
  public templateSelected = new EventEmitter<{
    step: Step;
    id: ProjectCreation['workspaceId'];
  }>();

  public createProjectForm!: FormGroup;
  public previousUrl: string = this.routeHistoryService.getPreviousUrl();

  public templates: Template[] = [
    {
      nextStep: 'blank',
      icon: 'empty',
      title: this.translocoService.translate(
        'new_project.first_step.blank_project'
      ),
      description: this.translocoService.translate(
        'new_project.first_step.blank_project_description'
      ),
      action: () => this.initProject('blank'),
    },
    {
      nextStep: 'template',
      icon: 'template',
      title: this.translocoService.translate(
        'new_project.first_step.template_project'
      ),
      description: this.translocoService.translate(
        'new_project.first_step.template_project_description'
      ),
      action: () => this.initProject('template'),
    },
    {
      nextStep: 'import',
      icon: 'import',
      title: this.translocoService.translate(
        'new_project.first_step.import_project'
      ),
      description: this.translocoService.translate(
        'new_project.first_step.import_project_description'
      ),
      action: () => this.initProject('import'),
    },
    {
      nextStep: 'duplicate',
      icon: 'duplicate',
      title: this.translocoService.translate(
        'new_project.first_step.duplicate_project'
      ),
      description: this.translocoService.translate(
        'new_project.first_step.duplicate_project_description'
      ),
      tip: this.translocoService.translate(
        'new_project.first_step.duplicate_project_tip'
      ),
      action: () => this.initProject('duplicate'),
    },
  ];

  public readonlyWorkspace = false;

  public get currentWorkspace(): FormControl {
    return this.createProjectForm.get('workspace') as FormControl;
  }

  public get getPreviousUrl() {
    return this.previousUrl ? [this.previousUrl] : ['/'];
  }

  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private routeHistoryService: RouteHistoryService
  ) {}

  public ngOnInit() {
    this.initForm();
    this.getLastRoute();
  }

  public getLastRoute() {
    if (this.previousUrl?.startsWith('/workspace')) {
      this.readonlyWorkspace = true;
    }
  }

  public initForm() {
    this.createProjectForm = this.fb.group({
      workspace: [undefined, Validators.required],
    });
  }

  public getCurrentWorkspace() {
    return this.workspaces.find(
      (workspace) => workspace.id === this.selectedWorkspaceId
    );
  }

  public trackByIndex(index: number) {
    return index;
  }

  public initProject(step: Step) {
    const workspace: Workspace = this.currentWorkspace.value as Workspace;
    if (this.createProjectForm.valid) {
      this.templateSelected.next({
        step,
        id: workspace.id,
      });
    } else {
      this.createProjectForm.markAllAsTouched();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.createProjectForm && changes.workspaces) {
      this.createProjectForm
        .get('workspace')
        ?.setValue(this.getCurrentWorkspace());
    }
  }
}
