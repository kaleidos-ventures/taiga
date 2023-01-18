/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
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
import { Membership, Permissions, Story, User } from '@taiga/data';
import { InputsModule } from '@taiga/ui/inputs/inputs.module';
import { map, Subject } from 'rxjs';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { initAssignUser } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectMembers } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { UserAvatarComponent } from '~/app/shared/user-avatar/user-avatar.component';
import { UserCardComponent } from '~/app/shared/user-card/user-card.component';
import { filterNil } from '~/app/shared/utils/operators';
import { UtilsService } from '~/app/shared/utils/utils-service.service';

interface AssignComponentState {
  members: Membership['user'][];
  membersPermissions: Record<Membership['user']['username'], Permissions[]>;
  assigned: Story['assignees'];
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
export class AssignUserComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput')
  public searchInput!: ElementRef;

  @Output()
  public requestClose = new EventEmitter<void>();

  @Output()
  public assign = new EventEmitter<Membership['user']>();

  @Output()
  public unassign = new EventEmitter<Membership['user']>();

  @Input()
  public viewOnly = false;

  @Input()
  public ref?: number;

  @Input()
  public set assigned(members: Story['assignees']) {
    this.state.set({ assigned: members });
  }

  @HostListener('document:keydown.escape')
  public onEsc() {
    this.requestClose.next();
  }

  public readonly model$ = this.state.select().pipe(
    map((state) => {
      const currentUserMember = state.members.find((member) => {
        return member.username === state.currentUser.username;
      });

      const members = state.members.filter((member) => {
        if (member.username === state.currentUser.username) {
          return false;
        }

        const assigned = state.assigned.find(
          (assigned) => assigned.username === member.username
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
        (assigned) => assigned.username === state.currentUser.username
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

  public ngAfterViewInit() {
    requestAnimationFrame(() => {
      (document.querySelector('.assignees-title') as HTMLElement)?.focus();
    });
  }

  public ngOnDestroy() {
    if (this.ref) {
      requestAnimationFrame(() => {
        const mainFocus = document.querySelector(
          `tg-kanban-story[data-ref='${this.ref!}'] .story-kanban-ref-focus`
        );
        if (mainFocus) {
          (mainFocus as HTMLElement).focus();
        }
      });
    }
  }

  public initState() {
    this.state.connect(
      'currentUser',
      this.store.select(selectUser).pipe(filterNil())
    );
    this.state.connect(
      'members',
      this.store.select(selectMembers).pipe(
        filterNil(),
        map((members) => {
          return members.map((member) => member.user);
        })
      )
    );
    this.state.connect(
      'membersPermissions',
      this.store.select(selectMembers).pipe(
        filterNil(),
        map((members) => {
          const permissions: Record<
            Membership['user']['username'],
            Permissions[]
          > = {};
          members.forEach((member) => {
            permissions[member.user.username] = member.role.permissions!;
          });
          return permissions;
        })
      )
    );
    this.state.connect('search', this.search$);
  }

  public checkMemberSearch(search: string, member: Membership['user']) {
    const rgx = new RegExp(
      `${UtilsService.normalizeText(search.replace(/^@/, ''))}`,
      'gi'
    );
    const fullname = UtilsService.normalizeText(member.fullName);
    const username = UtilsService.normalizeText(
      member.username.replace(/^@/, '')
    );

    return rgx.test(fullname) || rgx.test(username);
  }

  public onAssign(member: Membership['user']) {
    this.assign.next(member);
    (this.searchInput.nativeElement as HTMLElement).focus();
  }

  public trackByMember(_index: number, member: Membership['user']) {
    return member.username;
  }
}
