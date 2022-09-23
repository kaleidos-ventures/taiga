/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { RxState, selectSlice } from '@rx-angular/state';
import { Project, Role } from '@taiga/data';
import { fromEvent } from 'rxjs';
import {
  auditTime,
  filter,
  map,
  pairwise,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
import { PermissionsService } from '~/app/services/permissions.service';
import { filterFalsy, filterNil } from '~/app/shared/utils/operators';
import * as ProjectActions from './+state/actions/roles-permissions.actions';
import {
  initRolesPermissions,
  resetPermissions,
  updatePublicPermissions,
  updateRolePermissions,
  updateWorkspacePermissions,
} from './+state/actions/roles-permissions.actions';
import {
  selectMemberRoles,
  selectPublicPermissions,
  selectWorkspacePermissions,
} from './+state/selectors/roles-permissions.selectors';
import { EntityConflictPermission } from './models/modal-permission.model';
import { ProjectsSettingsFeatureRolesPermissionsService } from './services/feature-roles-permissions.service';

@UntilDestroy()
@Component({
  selector: 'tg-project-settings-feature-roles-permissions',
  templateUrl: './feature-roles-permissions.component.html',
  styleUrls: [
    './feature-roles-permissions.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectSettingsFeatureRolesPermissionsComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  @ViewChildren('fragment')
  public fragments!: QueryList<ElementRef>;

  public readonly model$ = this.state.select().pipe(
    map((model) => {
      const admin = model.memberRoles?.find((it) => it.isAdmin);
      return {
        ...model,
        admin,
      };
    })
  );

  public isModalOpen = false;

  public form = this.fb.group({});
  public publicForm = this.fb.group({});
  public workspaceForm = this.fb.group({});

  private readonly defaultFragment = 'member-permissions-settings';

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  public getRoleForm(role: Role) {
    return this.form.get(role.slug) as FormGroup;
  }

  public getPublicPermissionsForm() {
    const fg = this.publicForm.get('public') as unknown;

    return fg as FormGroup;
  }

  public getworkspacePermissionsForm() {
    const fg = this.workspaceForm.get('workspace') as unknown;

    return fg as FormGroup;
  }

  constructor(
    private actions$: Actions,
    private permissionsService: PermissionsService,
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
    private el: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private store: Store,
    private cd: ChangeDetectorRef,
    private state: RxState<{
      memberRoles?: Role[];
      publicPermissions?: string[];
      workspacePermissions?: string[];
      project: Project;
      conflicts: EntityConflictPermission[];
    }>
  ) {
    this.actions$
      .pipe(ofType(ProjectActions.resetPermissionForm))
      .subscribe(() => {
        this.initForm();
        this.cd.detectChanges();
      });
  }

  public ngOnInit() {
    this.state.set({ conflicts: [] });

    this.state.connect(
      'project',
      this.store.select(selectCurrentProject).pipe(filterNil())
    );

    this.state.connect(
      'conflicts',
      this.state.select(selectSlice(['publicPermissions', 'memberRoles'])).pipe(
        map(({ publicPermissions, memberRoles }) => {
          return this.projectsSettingsFeatureRolesPermissionsService.getMembersPermissionsConflics(
            publicPermissions ?? [],
            memberRoles ?? []
          );
        })
      )
    );

    this.state.connect(
      'memberRoles',
      this.store.select(selectMemberRoles).pipe(filterNil())
    );

    this.state.connect(
      'publicPermissions',
      this.store.select(selectPublicPermissions).pipe(filterNil())
    );

    this.state.connect(
      'workspacePermissions',
      this.store.select(selectWorkspacePermissions).pipe(filterNil())
    );

    this.state.hold(this.state.select('project'), (project) => {
      project.userIsAdmin &&
        this.store.dispatch(initRolesPermissions({ project }));
    });
  }

  public ngAfterViewInit() {
    this.initForm();
    this.watchFragment();
  }

  public initForm() {
    this.state.hold(
      this.state.select('memberRoles').pipe(take(1)),
      (roles = []) => {
        this.form = this.fb.group({});

        roles
          .filter((role) => !role.isAdmin)
          .forEach((role) => {
            this.createRoleFormControl(role.permissions, role.slug, this.form);
            this.watchRoleForm(role);
          });
      }
    );

    this.state.hold(
      this.state.select('publicPermissions').pipe(take(1)),
      (permissions = []) => {
        this.publicForm = this.fb.group({});
        this.createRoleFormControl(permissions, 'public', this.publicForm);
        this.watchPublicForm();
      }
    );

    this.state.hold(
      this.state.select('workspacePermissions').pipe(take(1)),
      (permissions = []) => {
        this.workspaceForm = this.fb.group({});
        this.createRoleFormControl(
          permissions,
          'workspace',
          this.workspaceForm
        );
        this.watchWorkspaceForm();
      }
    );
  }

  public watchRoleForm(role: Role) {
    const form = this.getRoleForm(role);

    form.valueChanges
      .pipe(untilDestroyed(this), auditTime(100))
      .subscribe(() => {
        this.saveMembers(role);
      });
  }

  public watchPublicForm() {
    this.publicForm.valueChanges
      .pipe(untilDestroyed(this), auditTime(100))
      .subscribe(() => {
        this.savePublic();
      });
  }

  public watchWorkspaceForm() {
    this.workspaceForm.valueChanges
      .pipe(untilDestroyed(this), auditTime(100))
      .subscribe(() => {
        this.saveWorkspace();
      });
  }

  public createRoleFormControl(
    permissions: string[],
    slug: string,
    form: FormGroup
  ) {
    const roleGroup = this.fb.group({});
    const currentPermissions =
      this.permissionsService.formatRawPermissions(permissions);

    for (const [
      entity,
    ] of this.projectsSettingsFeatureRolesPermissionsService.getEntities()) {
      const fb = this.fb.group({
        create: [false],
        modify: [false],
        delete: [false],
        comment: [false],
      });

      if (
        !this.projectsSettingsFeatureRolesPermissionsService.hasComments(entity)
      ) {
        fb.get('comment')?.disable();
      }

      roleGroup.addControl(entity, fb);

      if (!currentPermissions[entity]) {
        fb.disable();
      } else if (entity === 'sprint' && !currentPermissions.story) {
        fb.disable();
      } else if (entity === 'task' && !currentPermissions.story) {
        fb.disable();
      }
    }
    roleGroup.patchValue(currentPermissions);

    form.removeControl(slug);
    form.addControl(slug, roleGroup);
  }

  public saveMembers(role: Role) {
    const form = this.getRoleForm(role);

    const permissions =
      this.projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions(
        form
      );

    this.store.dispatch(
      updateRolePermissions({
        project: this.state.get('project').slug,
        roleSlug: role.slug,
        permissions,
      })
    );
  }

  public savePublic() {
    const permissions =
      this.projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions(
        this.getPublicPermissionsForm()
      );

    this.store.dispatch(
      updatePublicPermissions({
        project: this.state.get('project').slug,
        permissions,
      })
    );
  }

  public saveWorkspace() {
    const permissions =
      this.projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions(
        this.getworkspacePermissionsForm()
      );

    this.store.dispatch(
      updateWorkspacePermissions({
        project: this.state.get('project').slug,
        permissions,
      })
    );
  }

  public watchFragment() {
    // initial fragment
    this.fragments.changes
      .pipe(
        untilDestroyed(this),
        withLatestFrom(this.state.select('project')),
        map(([, project]) => {
          if (project.workspace.isPremium && this.fragments.length === 3) {
            return true;
          } else if (
            !project.workspace.isPremium &&
            this.fragments.length === 2
          ) {
            return true;
          }

          return false;
        }),
        filterFalsy(),
        switchMap(() => this.route.fragment.pipe(filterNil())),
        take(1)
      )
      .subscribe((fragment) => {
        this.focusFragment(fragment);
        void this.router.navigate([], {
          fragment: fragment,
        });
      });

    fromEvent(window, 'scroll')
      .pipe(
        untilDestroyed(this),
        withLatestFrom(this.route.fragment),
        auditTime(200),
        map(([, fragment]): [string | null, number] => {
          return [fragment, window.scrollY];
        }),
        pairwise()
      )
      .subscribe(([[, oldPosition], [fragment, newPosition]]) => {
        const fragments: HTMLElement[] = Array.from(
          document.querySelectorAll('[data-fragment]')
        );

        const viewPortFragments = fragments.filter((el) => {
          return this.isElementInViewport(el);
        });

        const isUp = oldPosition > newPosition;

        const lastFragment = isUp
          ? viewPortFragments[0]
          : viewPortFragments[viewPortFragments.length - 1];

        if (
          lastFragment?.dataset.fragment &&
          lastFragment.dataset.fragment !== fragment
        ) {
          this.changeFragment(lastFragment.dataset.fragment);
        }
      });

    this.router.events
      .pipe(
        filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd),
        map((evt) => evt.url.split('#')[1])
      )
      .subscribe((fragment) => {
        const isInternal = this.router.getCurrentNavigation()?.extras.state
          ?.internal as boolean;

        if (!isInternal) {
          this.focusFragment(fragment);
        }
      });
  }

  public focusFragment(fragment: string) {
    const el = this.nativeElement.querySelector(
      `[data-fragment="${fragment}"]`
    );

    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      (el as HTMLElement).focus({ preventScroll: true });
    }
  }

  public changeFragment(fragment: string) {
    void this.router.navigate([], {
      fragment: fragment,
      relativeTo: this.route,
      state: {
        internal: true,
      },
    });
  }

  public trackBySlug(_index: number, role: Role) {
    return role.slug;
  }

  public ngOnDestroy() {
    this.store.dispatch(resetPermissions());
  }

  public handleModal() {
    this.isModalOpen = !this.isModalOpen;
  }

  public isElementInViewport(el: HTMLElement) {
    const rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}
