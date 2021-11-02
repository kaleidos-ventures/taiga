/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User } from '@taiga/data';

@Component({
  selector: 'tg-invite-step',
  templateUrl: './invite-step.component.html',
  styleUrls: ['./invite-step.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteStepComponent implements OnInit {
  @Output()
  public finishNewProject = new EventEmitter<Partial<User>[]>();

  // This is a temporal variable until we get real users here.
  public userExample: Partial<User>[] = [
    {
      username: 'test-user',
      id: 1
    },
    {
      username: 'test-user-2',
      id: 2
    },
  ];

  public inviteProjectForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit() {
    this.initForm();
  }

  public initForm() {
    this.inviteProjectForm = this.fb.group({
      inviteUser: [null, Validators.required],
    });
  }

  public sendForm(users?: Partial<User>[]) {
    if (users && users.length) {
      this.finishNewProject.next(this.userExample);
    } else {
      this.finishNewProject.next([]);
    }
  }
}
