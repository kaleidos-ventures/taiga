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
import { AvatarModule } from '@taiga/ui/avatar';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'tg-projects-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    TuiDataListModule,
    TuiScrollbarModule,
    AvatarModule,
    RouterModule,
    TranslocoModule,
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
