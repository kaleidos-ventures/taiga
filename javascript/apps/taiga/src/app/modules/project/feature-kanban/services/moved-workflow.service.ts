/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { Status, Workflow } from '@taiga/data';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MovedWorkflowService {
  public statuses$ = new BehaviorSubject(null) as BehaviorSubject<
    null | Status[]
  >;

  public postponed$ = new BehaviorSubject(null) as BehaviorSubject<null | {
    workflow: Workflow;
    targetWorkflow: Workflow;
  }>;

  public set statuses(statuses: null | Status[]) {
    this.statuses$.next(statuses);
  }
  public get statuses() {
    return this.statuses$.value;
  }

  public set postponed(
    postponed: null | {
      workflow: Workflow;
      targetWorkflow: Workflow;
    }
  ) {
    this.postponed$.next(postponed);
  }

  public get postponed() {
    return this.postponed$.value;
  }
}
