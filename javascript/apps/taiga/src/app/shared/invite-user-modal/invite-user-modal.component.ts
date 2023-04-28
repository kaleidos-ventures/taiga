/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, concatLatestFrom, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TuiScrollbarComponent } from '@taiga-ui/core';
import { TuiTextAreaComponent } from '@taiga-ui/kit';
import {
  Contact,
  InvitationRequest,
  Project,
  Role,
  User,
  Workspace,
  Invitation,
  InvitationWorkspaceMember,
} from '@taiga/data';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, share, startWith, switchMap, throttleTime } from 'rxjs/operators';
import { selectUser } from '~/app/modules/auth/data-access/+state/selectors/auth.selectors';
import { initRolesPermissions } from '~/app/modules/project/settings/feature-roles-permissions/+state/actions/roles-permissions.actions';
import { InvitationService } from '~/app/services/invitation.service';
import {
  invitationProjectActions,
  invitationWorkspaceActions,
} from '~/app/shared/invite-user-modal/data-access/+state/actions/invitation.action';
import {
  selectMemberRolesOrdered,
  selectSearchFinished,
  selectProjectInvitations,
  selectProjectSuggestedUsers,
  selectWorkspaceInvitations,
  selectWorkspaceSuggestedUsers,
  selectProjectUsersToInvite,
  selectWorkspaceUsersToInvite,
} from '~/app/shared/invite-user-modal/data-access/+state/selectors/invitation.selectors';
import { selectWorkspace } from '~/app/modules/workspace/feature-detail/+state/selectors/workspace-detail.selectors';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { RxState } from '@rx-angular/state';
import { filterNil } from '~/app/shared/utils/operators';

interface InvitationForm {
  fullName: string;
  username?: string;
  color: number;
  roles: string;
  email?: string;
}

interface InviteUserState {
  workspace: Workspace | null;
  project: Project;
  suggestedUsers: Contact[];
  memberRoles: Role[] | null;
  searchInProgress: boolean;
  invitations: Invitation[] | InvitationWorkspaceMember[];
}
@UntilDestroy()
@Component({
  selector: 'tg-invite-user-modal',
  templateUrl: './invite-user-modal.component.html',
  styleUrls: [
    './styles/invite-user-modal.shared.css',
    './invite-user-modal.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'invitation_modal',
        alias: 'invitation_modal',
      },
    },
  ],
})
export class InviteUserModalComponent implements OnInit, OnChanges {
  @ViewChild(TuiScrollbarComponent, { read: ElementRef })
  private readonly scrollBar?: ElementRef<HTMLElement>;

  @Input()
  public isProjectInvitation!: boolean;

  @Input()
  public fromOverview?: boolean;

  @Input()
  public reset?: boolean;

  @Output()
  public closeModal = new EventEmitter();

  @Output()
  public inviteSuccess = new EventEmitter();

  @ViewChild('emailInput', { static: false })
  public emailInput!: TuiTextAreaComponent;

  @ViewChild('textArea')
  private textArea!: ElementRef<HTMLElement>;

  @HostListener('window:beforeunload')
  public unloadHandler() {
    return !this.formHasContent();
  }

  public model$ = this.state.select();
  public regexpEmail = /\w+([.\-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+/g;
  public inviteIdentifier = '';
  public inviteIdentifier$ = new BehaviorSubject('');
  public inviteIdentifierErrors: {
    required: boolean;
    regex: boolean;
    listEmpty: boolean;
    peopleNotAdded: boolean;
    bulkError: boolean;
    moreThanFifty: boolean;
  } = {
    required: false,
    regex: false,
    listEmpty: false,
    peopleNotAdded: false,
    bulkError: false,
    moreThanFifty: false,
  };
  public inviteUsersForm: FormGroup = this.fb.group({
    users: new FormArray([]),
  });
  public orderedRoles!: Role[] | null;

  public validEmails$ = new BehaviorSubject([] as string[]);
  public usersToInvite$!: Observable<Partial<User>[]>;
  public validInviteIdentifier$!: Observable<string[]>;
  public emailsWithoutDuplications$!: Observable<string[]>;
  public suggestionSelected = 0;
  public elegibleSuggestions: number[] | undefined = [];
  public search$: Subject<string | null> = new Subject();
  public notInBulkMode = true;
  public emailInputIsFocus = false;
  public titleName = '';

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private actions$: Actions,
    private invitationService: InvitationService,
    private state: RxState<InviteUserState>
  ) {
    this.actions$
      .pipe(
        ofType(
          ...[
            invitationProjectActions.inviteUsersSuccess,
            invitationWorkspaceActions.inviteUsersSuccess,
          ]
        ),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.inviteSuccess.emit();
        this.close();
      });

    this.validInviteIdentifier$ = this.inviteIdentifier$.pipe(
      throttleTime(200, undefined, { leading: true, trailing: true }),
      map((emails) => this.validateEmails(emails)),
      share(),
      startWith([])
    );

    this.emailsWithoutDuplications$ = this.validInviteIdentifier$.pipe(
      map((emails) =>
        emails?.filter((email, i) => emails.indexOf(email) === i)
      ),
      share(),
      startWith([])
    );
  }

  public get users() {
    return (this.inviteUsersForm.controls['users'] as FormArray)
      .controls as FormGroup[];
  }

  public get emailsHaveErrors() {
    return (
      this.inviteIdentifierErrors.required ||
      this.inviteIdentifierErrors.regex ||
      this.inviteIdentifierErrors.peopleNotAdded ||
      this.inviteIdentifierErrors.bulkError
    );
  }

  public get suggestionContactsDropdownActivate() {
    return (
      !!(this.inviteIdentifier.length > 1) &&
      !!this.state.get('suggestedUsers').length &&
      !!this.notInBulkMode
    );
  }

  public get parseTextToHighlight() {
    return this.inviteIdentifier.replace(/^@/, '');
  }

  public ngOnInit() {
    if (this.isProjectInvitation) {
      this.state.connect(
        'project',
        this.store.select(selectCurrentProject).pipe(filterNil())
      );
      this.state.connect(
        'memberRoles',
        this.store.select(selectMemberRolesOrdered)
      );
    } else {
      this.state.connect(
        'workspace',
        this.store.select(selectWorkspace).pipe(filterNil())
      );
    }
    this.state.connect(
      'suggestedUsers',
      this.isProjectInvitation
        ? this.store.select(selectProjectSuggestedUsers)
        : this.store.select(selectWorkspaceSuggestedUsers)
    );
    this.state.connect(
      'invitations',
      this.isProjectInvitation
        ? this.store.select(selectProjectInvitations)
        : this.store.select(selectWorkspaceInvitations)
    );
    this.state.connect(
      'searchInProgress',
      this.store.select(selectSearchFinished)
    );
    this.usersToInvite$ = this.isProjectInvitation
      ? this.validEmails$.pipe(
          switchMap((validEmails) => {
            return this.store.select(selectProjectUsersToInvite(validEmails));
          })
        )
      : this.validEmails$.pipe(
          switchMap((validEmails) => {
            return this.store.select(selectWorkspaceUsersToInvite(validEmails));
          })
        );

    // when we add users to invite its necessary to add the result to the form
    this.usersToInvite$
      .pipe(
        concatLatestFrom(() => this.store.select(selectUser)),
        untilDestroyed(this)
      )
      .subscribe(([userToInvite, currentUser]) => {
        userToInvite.forEach((user) => {
          const userAlreadyExist = this.users?.find((it: FormGroup) => {
            return (it.value as Partial<User>).email
              ? (it.value as Partial<User>).email === user.email
              : (it.value as Partial<User>).username === user.username;
          });
          const isCurrentUser = currentUser?.email
            ? currentUser?.email === user.email
            : currentUser?.username === user.username;
          if (!userAlreadyExist && !isCurrentUser) {
            this.users.splice(
              this.positionInArray(user),
              0,
              this.fb.group(user)
            );
          }
        });
        this.resetField();
        this.emailInput?.nativeFocusableElement?.focus();
      });

    if (this.isProjectInvitation) {
      this.state.hold(this.state.select('project'), (project) => {
        this.store.dispatch(initRolesPermissions({ project }));
      });
      this.state.hold(this.state.select('memberRoles'), (memberRoles) => {
        this.orderedRoles = memberRoles;
      });
    }

    this.state.hold(this.state.select('suggestedUsers'), (suggestedUsers) => {
      this.elegibleSuggestions = [];
      suggestedUsers?.forEach((it, i) => {
        if (!it.userIsMember && !it.userIsAddedToList) {
          this.elegibleSuggestions?.push(i);
        }
      });
      this.suggestionSelected = this.elegibleSuggestions?.[0] || 0;
    });

    this.titleName = this.isProjectInvitation
      ? this.state.get('project')!.name
      : this.state.get('workspace')!.name;
  }

  public ngOnChanges(changes: SimpleChanges) {
    changes.reset && this.cleanFormBeforeClose();
  }

  public onActiveZone(active: boolean): void {
    this.updateEmailInputIsFocus(active);
  }

  public positionInArray(user: Partial<User>) {
    const tempInvitations = this.users.map((it) => {
      const data = it.value as InvitationForm;
      return {
        user:
          data.username && data.fullName && data.color
            ? {
                username: data.username,
                fullName: data.fullName,
                color: data.color,
              }
            : undefined,
        email: data.email || '',
        role: {
          isAdmin: data.roles === 'Administrator',
          name: data.roles,
        },
      };
    });
    const tempInvitation = {
      user:
        user.username && user.fullName && user.color
          ? {
              username: user.username,
              fullName: user.fullName,
              color: user.color,
            }
          : undefined,
      email: user.email || '',
      role: {
        isAdmin: (user.roles && user.roles[0]) === 'Administrator',
        name: user.roles && user.roles[0],
      },
    };
    return this.invitationService.positionInvitationInArray(
      tempInvitations,
      tempInvitation
    );
  }

  public validateEmails(emails: string) {
    return emails.match(this.regexpEmail) || [];
  }

  public formHasContent() {
    return !!this.inviteIdentifier || !!this.users.length;
  }

  public trackByIndex(index: number) {
    return index;
  }

  public getPeopleAdded() {
    const registeredUsers = this.users.filter(
      (it) => it.get('fullName')?.value
    );
    if (registeredUsers.length) {
      return registeredUsers.map((user) => {
        return {
          fullName: user.get('fullName')?.value as string,
          username: user.get('username')?.value as string,
          color: user.get('color')?.value as string,
          userIsAddedToList: true,
        };
      });
    } else {
      return [];
    }
  }

  public searchChange(emails: string) {
    (!emails || this.emailsHaveErrors) && this.resetErrors();
    this.suggestionSelected = this.elegibleSuggestions?.[0] || 0;
    if (/[^@]+@/.test(emails)) {
      // when the input contains and @ the search is disabled
      this.notInBulkMode = false;
      this.inviteIdentifier$.next(emails);
      this.handleAccessibilityAttributes(false);
    } else if (emails.trim().length > 1) {
      this.notInBulkMode = true;
      const searchText = this.inviteIdentifier.replace(/^@/, '');
      if (this.isProjectInvitation) {
        this.store.dispatch(
          invitationProjectActions.searchUsers({
            searchUser: {
              text: searchText,
              project: this.state.get('project')!.id,
            },
            peopleAdded: this.getPeopleAdded(),
          })
        );
      } else {
        this.store.dispatch(
          invitationWorkspaceActions.searchUsers({
            searchUser: {
              text: searchText,
              workspace: this.state.get('workspace')!.id,
            },
            peopleAdded: this.getPeopleAdded(),
          })
        );
      }
      this.handleAccessibilityAttributes(true);
      this.updateEmailInputIsFocus(true);
    }
  }

  public updateEmailInputIsFocus(focus: boolean) {
    this.emailInputIsFocus = focus;
  }

  public onSearchChange(searchQuery: string | null): void {
    this.search$.next(searchQuery);
  }

  public extractValueFromEvent(event: Event): string | null {
    return (event.target as HTMLInputElement)?.value || null;
  }

  public resetErrors() {
    this.inviteIdentifierErrors = {
      required: false,
      regex: false,
      listEmpty: false,
      peopleNotAdded: false,
      bulkError: false,
      moreThanFifty: false,
    };
  }

  public filterValidEmails(value: string) {
    return value.match(this.regexpEmail) || [];
  }

  public addUser() {
    const emailRgx = this.regexpEmail.test(this.inviteIdentifier);
    const bulkErrors = this.inviteIdentifier
      .replace(this.regexpEmail, '')
      .replace(/[;,\s\n]/g, '');
    this.resetErrors();
    if (this.suggestionContactsDropdownActivate) {
      const user = this.state.get('suggestedUsers')[this.suggestionSelected];
      if (user && !user.userIsMember && !user.userIsAddedToList) {
        this.includeSuggestedContact(this.suggestionSelected);
      }
    } else if (this.inviteIdentifier === '') {
      this.inviteIdentifierErrors.required = true;
    } else if (!emailRgx) {
      this.inviteIdentifierErrors.regex = true;
      this.notInBulkMode = false;
    } else if (bulkErrors) {
      this.inviteIdentifierErrors.bulkError = true;
    } else {
      this.validEmails$.next(this.filterValidEmails(this.inviteIdentifier));
    }
  }

  public deleteUser(i: number) {
    (this.inviteUsersForm.controls['users'] as FormArray).removeAt(i);
    // force recalculate scroll height in Firefox
    requestAnimationFrame(() => {
      if (this.scrollBar) {
        this.scrollBar.nativeElement.scrollTop = 0;
        this.scrollBar.nativeElement.scrollTop =
          this.scrollBar.nativeElement.scrollHeight;
      }
    });
    this.searchChange(this.inviteIdentifier);
  }

  public includeSuggestedContact(index: number, event?: Event) {
    event?.preventDefault();
    const suggestedUsers = [...this.state.get('suggestedUsers')];
    if (suggestedUsers[index] && !suggestedUsers[index].userIsMember) {
      if (this.isProjectInvitation) {
        this.store.dispatch(
          invitationProjectActions.addSuggestedContact({
            contact: suggestedUsers[index],
          })
        );
      } else {
        this.store.dispatch(
          invitationWorkspaceActions.addSuggestedContact({
            contact: suggestedUsers[index],
          })
        );
      }
      this.validEmails$.next([suggestedUsers[index].username]);
    }
  }

  public handleArrow(arrow: 'up' | 'down') {
    const currentIndex =
      this.elegibleSuggestions?.findIndex(
        (it) => it === this.suggestionSelected
      ) || 0;
    if (this.elegibleSuggestions) {
      if (arrow === 'up') {
        const index = currentIndex === 0 ? currentIndex : currentIndex - 1;
        this.suggestionSelected = this.elegibleSuggestions[index];
      } else {
        const index =
          currentIndex === this.elegibleSuggestions.length - 1
            ? currentIndex
            : currentIndex + 1;
        this.suggestionSelected = this.elegibleSuggestions[index];
      }
    }
    this.updateActiveDescendant();
  }

  public handleAccessibilityAttributes(activate: boolean) {
    const textArea = this.textArea.nativeElement.querySelector('textarea');
    if (activate) {
      textArea?.setAttribute('role', 'combobox');
      textArea?.setAttribute('aria-controls', 'suggestions');
      textArea?.setAttribute('aria-autocomplete', 'list');
      textArea?.setAttribute('aria-haspopup', 'true');
      textArea?.setAttribute('aria-expanded', 'true');
    } else {
      textArea?.setAttribute('role', 'textbox');
      textArea?.setAttribute('aria-controls', '');
      textArea?.setAttribute('aria-autocomplete', '');
      textArea?.setAttribute('aria-haspopup', 'false');
      textArea?.setAttribute('aria-expanded', 'false');
      textArea?.setAttribute('aria-activedescendant', '');
      this.suggestionSelected = 0;
    }
    this.updateActiveDescendant();
  }

  public updateActiveDescendant() {
    const textArea = this.textArea.nativeElement.querySelector('textarea');
    textArea?.setAttribute(
      'aria-activedescendant',
      `suggestion-${this.suggestionSelected}`
    );
  }

  public getRoleSlug(roleName: string) {
    return this.orderedRoles?.find((role) => role.name === roleName);
  }

  public generatePayload(): InvitationRequest[] {
    return this.users.map((user) => {
      let data: InvitationRequest = {};
      if (this.isProjectInvitation) {
        data = {
          email: user.get('email')?.value as string,
          username: user.get('username')?.value as string,
          roleSlug:
            this.getRoleSlug(user.get('roles')?.value as string)?.slug || '',
        };
      } else {
        data = {
          usernameOrEmail:
            (user.get('username')?.value as string) ||
            (user.get('email')?.value as string),
        };
      }
      return data;
    });
  }

  public sendForm() {
    this.resetErrors();
    if (this.users.length > 50) {
      this.inviteIdentifierErrors.moreThanFifty = true;
    } else if (this.users.length && this.inviteIdentifier === '') {
      this.handleDispatch();
    } else if (this.inviteIdentifier === '') {
      this.inviteIdentifierErrors.listEmpty = true;
      this.emailInput?.nativeFocusableElement?.focus();
    }
    this.inviteIdentifierErrors.peopleNotAdded = !!this.inviteIdentifier;
  }

  public handleDispatch() {
    if (this.isProjectInvitation) {
      this.store.dispatch(
        invitationProjectActions.inviteUsers({
          id: this.state.get('project')!.id,
          invitation: this.generatePayload(),
        })
      );
    } else {
      this.store.dispatch(
        invitationWorkspaceActions.inviteUsers({
          id: this.state.get('workspace')!.id,
          invitation: this.generatePayload(),
        })
      );
    }
  }

  public cleanFormBeforeClose() {
    this.resetErrors();
    this.resetField();
    this.inviteUsersForm = this.fb.group({
      users: new FormArray([]),
    });
  }

  public resetField() {
    this.inviteIdentifier = '';
    this.searchChange('');
    this.inviteIdentifier$.next('');
  }

  public close() {
    this.cleanFormBeforeClose();
    this.closeModal.emit();
  }

  public removeFocus() {
    this.emailInput?.nativeFocusableElement?.blur();
  }
}
