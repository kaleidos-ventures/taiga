/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Workspace } from '@taiga/data';

export interface Template {
  id: number;
  icon: string;
  title: string;
  description: string;
  action: () => void;
}

@Component({
  selector: 'tg-template-step',
  templateUrl: './template-step.component.html',
  styleUrls: ['./template-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
})
export class TemplateStepComponent implements OnInit {

  @Input() public workspaces!: Workspace[];

  public createProjectForm!: FormGroup;

  public templates: Template[] = [
    {
      id: 1,
      icon: 'loader',
      title: 'Blank project',
      description: 'Start a project from scratch',
      action: () => this.createBlankProject(),
    },
    {
      id: 2,
      icon: 'loader',
      title: 'Blank project',
      description: 'Start a project from scratch',
      action: () => null,
    },
    {
      id: 3,
      icon: 'loader',
      title: 'Blank project',
      description: 'Start a project from scratch',
      action: () => null,
    },
    {
      id: 4,
      icon: 'loader',
      title: 'Blank project',
      description: 'Start a project from scratch',
      action: () => null,
    }
  ];

  constructor(
    private fb: FormBuilder
  ) {}
  
  public ngOnInit() {
    this.initForm();
  }

  public initForm() {
    this.createProjectForm = this.fb.group({
      workspace: this.workspaces[0],
    });
  }

  public trackByIndex(index: number) {
    return index;
  }

  public createBlankProject() {
    console.log('create blank project');
  }
}
