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
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  TuiNotification,
  TuiButtonModule,
  TuiTextfieldControllerModule,
  TuiDataListModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { ProjectCreation, Workspace, WorkspaceMembership } from '@taiga/data';
import {
  Step,
  Template,
} from '~/app/modules/feature-new-project/data/new-project.model';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';
import { TuiDataListWrapperModule } from '@taiga-ui/kit/components/data-list-wrapper';
import { TuiSelectModule } from '@taiga-ui/kit';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { TitleDirective } from '~/app/shared/title/title.directive';
import { InputsModule } from '@taiga/ui/inputs';

@UntilDestroy()
@Component({
  selector: 'tg-init-step',
  templateUrl: './init-step.component.html',
  styleUrls: ['../../styles/project.shared.css', './init-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslocoDirective,
    TuiButtonModule,
    RouterLink,
    TitleDirective,
    ReactiveFormsModule,
    TuiSelectModule,
    TuiTextfieldControllerModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiSvgModule,
    AvatarComponent,
    InputsModule,
  ],
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
  ];

  public readonlyWorkspace = false;

  public get currentWorkspace(): FormControl {
    return this.createProjectForm.get('workspace') as FormControl;
  }

  public get getPreviousUrl(): string[] {
    return this.previousUrl ? [this.previousUrl] : ['/'];
  }

  public get workspacesMember(): Workspace[] {
    return this.workspaces.filter(
      (workspace) => workspace.userRole === 'member'
    );
  }

  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private routeHistoryService: RouteHistoryService,
    private wsService: WsService,
    private router: Router,
    private appService: AppService
  ) {}

  public ngOnInit() {
    this.initForm();
    this.getLastRoute();
    this.events();
  }

  public events() {
    this.wsService
      .userEvents<{ membership: WorkspaceMembership }>(
        'workspacememberships.delete'
      )
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        if (this.previousUrl?.startsWith('/workspace')) {
          void this.router.navigate(['/']);
        }
        this.appService.toastNotification({
          message: 'common_members_tabs.no_longer_member',
          paramsMessage: {
            name: msg.event.content.membership.workspace.name,
            type: 'workspace',
          },
          status: TuiNotification.Error,
          closeOnNavigation: false,
        });
      });
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
    return this.workspacesMember.find(
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
        ?.setValue(this.getCurrentWorkspace() || this.workspacesMember[0]);
    }
  }
}
