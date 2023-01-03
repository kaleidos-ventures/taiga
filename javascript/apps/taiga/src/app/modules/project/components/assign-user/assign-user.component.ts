/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { TuiAutoFocusModule } from '@taiga-ui/cdk';
import {
  TuiHintModule,
  TuiLinkModule,
  TuiScrollbarModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { TuiToggleModule } from '@taiga-ui/kit';
import { Membership, User } from '@taiga/data';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import Diacritics from 'diacritic';
import { map, Subject } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { initAssignUser } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectMembers } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { filterNil } from '~/app/shared/utils/operators';

interface AssignComponentState {
  members: Membership[];
  assigned: Membership[];
  search: string;
  currentUser: User;
}
@Component({
  selector: 'tg-assign-user',
  standalone: true,
  imports: [
    CommonTemplateModule,
    UserAvatarComponent,
    TuiAutoFocusModule,
    FormsModule,
    ReactiveFormsModule,
    TuiLinkModule,
    TuiScrollbarModule,
    TuiToggleModule,
    TuiSvgModule,
    TuiHintModule,
    UserCardComponent,
    InputsModule,
  ],
  templateUrl: './assign-user.component.html',
  styleUrls: ['./assign-user.component.css'],
  providers: [RxState],
})
export class AssignUserComponent implements OnInit {
  @Output()
  public requestClose = new EventEmitter<void>();

  @Output()
  public assign = new EventEmitter<Membership>();

  @Output()
  public unassign = new EventEmitter<Membership>();

  @Input()
  public set assigned(members: Membership[]) {
    this.state.set({ assigned: members });
  }

  @HostListener('document:keydown.escape')
  public onEsc() {
    this.requestClose.next();
  }

  public viewOnly = false;

  // TODO: The project members that cannot access stories should appear as a disabled list item with a label that informs of the situation.
  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const currentUserMember = state.members.find((member) => {
        return member.user.username === state.currentUser.username;
      });

      const members = state.members.filter((member) => {
        if (member.user.username === state.currentUser.username) {
          return false;
        }

        const assigned = state.assigned.find(
          (assigned) => assigned.user.username === member.user.username
        );

        if (assigned) {
          return false;
        }

        if (state.search) {
          return this.checkMemberSearch(state.search, member);
        }

        return true;
      });

      // current user on top
      const currentUserAssigned = state.assigned.find(
        (assigned) => assigned.user.username === state.currentUser.username
      );

      if (currentUserMember && !currentUserAssigned) {
        members.unshift(currentUserMember);
      }

      return {
        ...state,
        members,
      };
    })
  );

  public readonly search$ = new Subject<string>();

  public searchTextForm!: FormGroup;

  constructor(
    private store: Store,
    private state: RxState<AssignComponentState>,
    private fb: FormBuilder
  ) {
    this.store.dispatch(initAssignUser());

    this.initState();
  }

  public ngOnInit(): void {
    this.searchTextForm = this.fb.group({
      searchText: '',
    });
  }

  public initState() {
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
    this.state.connect('members', this.store.select(selectMembers));
    this.state.connect('search', this.search$);
  }

  public checkMemberSearch(search: string, member: Membership) {
    const rgx = new RegExp(
      `${this.normalizeText(search.replace(/^@/, ''))}`,
      'gi'
    );
    const fullname = this.normalizeText(member.user.fullName);
    const username = this.normalizeText(member.user.username.replace(/^@/, ''));

    return rgx.test(fullname) || rgx.test(username);
  }

  public onAssign(member: Membership) {
    this.searchTextForm.setValue({
      searchText: '',
    });
    this.search$.next('');

    this.assign.next(member);
  }

  public trackByMember(_index: number, member: Membership) {
    return member.user.username;
  }

  private normalizeText(text: string) {
    const partialNormalize = Diacritics.clean(text).toLowerCase();
    return partialNormalize.normalize('NFD').replace(/[Ð-ð]/g, 'd');
  }
}
