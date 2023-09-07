/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '@taiga/data';
import { DropdownModule } from '../dropdown/dropdown.module';
import { TuiDataListModule, TuiScrollbarModule } from '@taiga-ui/core';

import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';

@Component({
  selector: 'tg-projects-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    TuiDataListModule,
    TuiScrollbarModule,
    RouterModule,
    TranslocoModule,
    AvatarComponent,
  ],
  templateUrl: './projects-dropdown.component.html',
  styleUrls: ['./projects-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsDropdownComponent {
  @Input({ required: true }) public projects: Pick<
    Project,
    'id' | 'logoSmall' | 'name' | 'slug' | 'color'
  >[] = [];

  public displayProjectList = false;

  public displayProjectsList() {
    this.displayProjectList = true;
  }

  public trackByProject(_index: number, project: Partial<Project>) {
    return project.id;
  }
}
