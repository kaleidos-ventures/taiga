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
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { ProjectCreation } from '@taiga/data';
import { fetchWorkspaceList } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';
import { createProject } from '~/app/modules/feature-new-project/+state/actions/new-project.actions';
import { selectWorkspaces } from '~/app/modules/workspace/feature-list/+state/selectors/workspace.selectors';
import { Step } from '~/app/modules/feature-new-project/data/new-project.model';
import { ActivatedRoute } from '@angular/router';
import {
  TemplateProjectForm,
  TemplateStepComponent,
} from '../template-step/template-step.component';
import { Observable } from 'rxjs';
import { Actions } from '@ngrx/effects';

@Component({
  selector: 'tg-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['../../styles/project.shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectComponent implements OnInit {
  @ViewChild(TemplateStepComponent)
  public templateStepComponent?: TemplateStepComponent;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private actions$: Actions,
    private cd: ChangeDetectorRef
  ) {}

  public workspaceList$ = this.store.select(selectWorkspaces);
  public currentStep: Step = 'init';
  public savedForm?: TemplateProjectForm;

  public formData: ProjectCreation = {
    workspaceSlug: '',
    name: '',
    description: 'string',
    color: 0,
  };

  public ngOnInit() {
    this.store.dispatch(fetchWorkspaceList());
    this.setQueryParamSlug();
  }

  public canDeactivate(): boolean | Observable<boolean> {
    if (this.currentStep === 'blank' && this.templateStepComponent) {
      return this.templateStepComponent.canDeactivate();
    }
    return true;
  }

  public setQueryParamSlug() {
    const slug = this.route.snapshot.queryParamMap.get('workspace');
    if (slug) {
      this.formData.workspaceSlug = slug;
    }
  }

  public onSelectTemplate(
    step: Step,
    workspaceSlug: ProjectCreation['workspaceSlug']
  ) {
    this.formData.workspaceSlug = workspaceSlug;
    this.setStep(step);
  }

  public createProject(project: ProjectCreation) {
    this.formData = project;
    this.store.dispatch(createProject({ project: this.formData }));
  }

  public setStep(step: Step) {
    this.currentStep = step;
  }

  public cancelTemplateStep(savedForm?: TemplateProjectForm) {
    this.currentStep = 'init';

    if (savedForm) {
      this.savedForm = savedForm;
    } else {
      window.history.back();
    }
  }
}
