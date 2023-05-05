/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TuiNotification } from '@taiga-ui/core';
import { ProjectCreation, Workspace, WorkspaceMembership } from '@taiga/data';
import { ModalComponent } from '@taiga/ui/modal/components';
import { RandomColorService } from '@taiga/ui/services/random-color/random-color.service';
import { Subject } from 'rxjs';
import { AppService } from '~/app/services/app.service';
import { WsService } from '~/app/services/ws';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';

export type TemplateProjectForm = Pick<
  ProjectCreation,
  'name' | 'color' | 'description' | 'logo'
>;

@UntilDestroy()
@Component({
  selector: 'tg-template-step',
  templateUrl: './template-step.component.html',
  styleUrls: [
    '../../styles/project.shared.css',
    './template-step.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateStepComponent implements OnInit {
  @Input()
  public initialForm?: TemplateProjectForm;

  @Input()
  public selectedWorkspaceId!: ProjectCreation['workspaceId'];

  @Input()
  public workspaces!: Workspace[];

  @ViewChild(ModalComponent)
  public modal!: ModalComponent;

  @Output()
  public projectData = new EventEmitter<ProjectCreation>();

  @Output()
  public cancel = new EventEmitter<undefined | TemplateProjectForm>();

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.formHasContent();
  }

  public templateProjectForm!: FormGroup;
  public showWarningModal = false;
  public confirmationModal$?: Subject<boolean>;
  public formSubmitted = false;
  public safeUnload = false;

  public get logo() {
    return this.templateProjectForm.get('logo') as FormControl;
  }

  public get workspace() {
    return this.templateProjectForm.get('workspace')?.value as Workspace;
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

  public canDeactivate() {
    if (this.formHasContent() && !this.formSubmitted && !this.safeUnload) {
      this.confirmationModal$ = new Subject();
      this.showWarningModal = true;
      this.cd.detectChanges();

      return this.confirmationModal$.asObservable();
    } else {
      return true;
    }
  }

  constructor(
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private routeHistoryService: RouteHistoryService,
    private wsService: WsService,
    private router: Router,
    private appService: AppService
  ) {}

  public ngOnInit() {
    this.initForm();
    this.events();
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

    this.templateProjectForm
      .get('workspace')
      ?.setValue(this.getCurrentWorkspace());
  }

  public events() {
    this.wsService
      .userEvents<{ membership: WorkspaceMembership }>(
        'workspacememberships.delete'
      )
      .pipe(untilDestroyed(this))
      .subscribe((msg) => {
        if (this.workspace.id === msg.event.content.membership.workspace.id) {
          this.safeUnload = true;
          this.appService.toastNotification({
            message: 'common_members_tabs.no_longer_member',
            paramsMessage: {
              name: msg.event.content.membership.workspace.name,
              type: 'workspace',
            },
            status: TuiNotification.Error,
            closeOnNavigation: false,
          });
          void this.router.navigate(['/']);
        }
      });
  }

  public getCurrentWorkspace() {
    return this.workspaces.find(
      (workspace) => workspace.id === this.selectedWorkspaceId
    );
  }

  public previousStep() {
    this.cancel.next({
      name: this.formValue.name,
      description: this.formValue.description,
      color: this.formValue.color,
      logo: this.formValue.logo,
    });
  }

  public cancelForm() {
    this.routeHistoryService.back();
  }

  public formHasContent() {
    const data = [
      this.templateProjectForm.get('name')?.value,
      this.templateProjectForm.get('description')?.value,
      this.templateProjectForm.get('logo')?.value,
    ];

    return data.some((value) => value);
  }

  public createProject() {
    (this.templateProjectForm.get('logo') as FormControl).setErrors(null);

    this.templateProjectForm.markAllAsTouched();
    if (this.templateProjectForm.valid) {
      const workspace = this.formValue.workspace;

      const projectFormValue: ProjectCreation = {
        workspaceId: workspace.id,
        name: this.formValue.name,
        description: this.formValue.description,
        color: this.formValue.color,
        logo: this.formValue.logo,
      };
      this.projectData.next(projectFormValue);
      this.formSubmitted = true;
    }
  }

  public cancelRedirect() {
    this.showWarningModal = false;
    if (this.confirmationModal$) {
      this.confirmationModal$.next(false);
      this.confirmationModal$.complete();
    }
  }

  public acceptWarningClose() {
    if (this.confirmationModal$) {
      this.confirmationModal$.next(true);
      this.confirmationModal$.complete();
    }
  }
}
