/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, Input } from '@angular/core';
import { Project, WorkspaceMembership } from '@taiga/data';

@Component({
  selector: 'tg-workspace-detail-people-members-projects',
  templateUrl: './workspace-detail-people-members-projects.component.html',
  styleUrls: ['./workspace-detail-people-members-projects.component.css'],
})
export class WorkspaceDetailPeopleMembersProjectsComponent {
  @Input() public member!: WorkspaceMembership;

  public displayProjectList = false;

  public displayProjectsList() {
    this.displayProjectList = true;
  }

  public trackByProject(_index: number, project: Partial<Project>) {
    return project.id;
  }
}
