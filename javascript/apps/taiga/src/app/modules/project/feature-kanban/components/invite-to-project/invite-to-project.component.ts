/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Project, User } from '@taiga/data';

@Component({
  selector: 'tg-invite-to-project',
  templateUrl: './invite-to-project.component.html',
  styleUrls: [
    '../../styles/kanban.shared.css',
    './invite-to-project.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteToProjectComponent {
  @Input()
  public project!: Project;

  @Output()
  public finishNewProject = new EventEmitter<Partial<User>[]>();

  @Output()
  public closeModal = new EventEmitter();

  public inviteEmails?: string;

  // This is a temporal variable until we get real users here.
  public userExample: Partial<User>[] = [
    {
      username: '@test-user',
      fullName: 'Test User',
      roles: ['General'],
      id: 1,
    },
    {
      username: '@test-user-2',
      fullName: 'Test User2',
      roles: ['General'],
      id: 2,
    },
    {
      username: undefined,
      fullName: undefined,
      email: 'test@test.com',
      roles: ['General'],
      id: 2,
    },
  ];

  public inviteProjectForm: FormGroup = this.fb.group({
    users: new FormArray([]),
  });

  constructor(private fb: FormBuilder, private route: ActivatedRoute) {}

  public get users() {
    return (this.inviteProjectForm.controls['users'] as FormArray)
      .controls as FormGroup[];
  }

  public get getEmails() {
    const regexp = /\S+@\S+\.\S+/g;
    return this.inviteEmails?.match(regexp) || [];
  }

  public emailsWithoutDuplications() {
    const emails = this.getEmails;
    return emails?.filter((email, i) => emails.indexOf(email) === i);
  }

  public trackByIndex(index: number) {
    return index;
  }

  public addUser() {
    //TODO connect with the api to verify the email
    this.users.push(this.fb.group(this.userExample[0]));
  }

  public deleteUser(i: number) {
    (this.inviteProjectForm.controls['users'] as FormArray).removeAt(i);
  }

  public sendForm(users?: Partial<User>[]) {
    if (users && users.length) {
      this.finishNewProject.next(this.userExample);
      this.close();
    }
  }

  public close() {
    this.closeModal.next();
  }
}
