/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Component, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { NewProjectComponent } from '~/app/features/project/new-project/components/new-project/new-project.component';
import { NewProjectCanDeactivate } from '~/app/features/project/new-project/new-project-pending-changes.guard';

@Component({
  selector: 'tg-new-project-page',
  templateUrl: './new-project-page.component.html',
  styleUrls: ['./new-project-page.component.css']
})
export class NewProjectPageComponent implements NewProjectCanDeactivate {

  @ViewChild(NewProjectComponent)
  public newProjectComponent!: NewProjectComponent;

  public canDeactivate(): boolean | Observable<boolean> {
    return this.newProjectComponent.canDeactivate();
  }
}
