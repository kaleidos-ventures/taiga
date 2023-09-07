/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Project } from '@taiga/data';
import { NavigationService } from '~/app/shared/navigation/navigation.service';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { RouterLink } from '@angular/router';
import { TuiDataListModule, TuiButtonModule } from '@taiga-ui/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';

@Component({
  selector: 'tg-navigation-projects',
  templateUrl: './navigation-projects.component.html',
  styleUrls: ['./navigation-projects.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TuiDataListModule,
    RouterLink,
    AvatarComponent,
    TuiButtonModule,
  ],
})
export class NavigationProjectsComponent {
  constructor(public navigationService: NavigationService) {}

  public latestProjects$ = this.navigationService.latestProjects;

  public trackByProject(_index: number, project: Project) {
    return project.slug;
  }
}
