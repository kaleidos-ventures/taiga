/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project, Role } from '@taiga/data';
import { auditTime, filter, map, skip, take } from 'rxjs/operators';
import { fetchRoles, updateRolePermissions } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectProject, selectRoles } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
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
  providers: [RxState]
})
export class ProjectSettingsFeatureRolesPermissionsComponent implements AfterViewInit {
  private readonly defaultFragment =  'member-permissions-settings';

  public readonly form = this.fb.group({});
  public readonly model$ = this.state.select().pipe(
    map((model) => {
      const admin = model.roles.find((it) => it.isAdmin);

      return {
        ...model,
        admin,
      };
    })
  );

  public getRoleForm(role: Role) {
    return this.form.get(role.slug) as FormGroup;
  }

  constructor(
    private projectsSettingsFeatureRolesPermissionsService: ProjectsSettingsFeatureRolesPermissionsService,
    private el: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private store: Store,
    private state: RxState<{
      roles: Role[]
      project: Project,
    }>,
  ) {
    this.state.connect('project', this.store.select(selectProject).pipe(
      filter((project): project is Project => !!project))
    );
    this.state.connect('roles', this.store.select(selectRoles));

    this.state.hold(this.state.select('project'), (project) => {
      this.store.dispatch(fetchRoles({ slug: project.slug }));
    });
  }

  public ngAfterViewInit() {
    this.watchFragment();
    this.initForm();
  }

  public initForm() {
    this.state.hold(this.state.select('roles'), (roles) => {
      roles
        .filter((role) => !role.isAdmin)
        .forEach((role) => {
          this.createRoleFormControl(role);
        });
    });

    this.form.valueChanges.pipe(
      skip(1),
      untilDestroyed(this),
      auditTime(100),
    ).subscribe(() => {
      this.save();
    });
  }

  public createRoleFormControl(role: Role) {
    const roleGroup = this.fb.group({});
    const currentPermissions = this.projectsSettingsFeatureRolesPermissionsService.formatRawPermissions(role.permissions);

    for (const [ module ] of this.projectsSettingsFeatureRolesPermissionsService.getModules()) {
      const fb = this.fb.group({
        create: [false],
        modify: [false],
        delete: [false],
      });

      if (this.projectsSettingsFeatureRolesPermissionsService.hasComments(module)) {
        fb.addControl('comment', new FormControl);
      }

      roleGroup.addControl(module, fb);

      if (!currentPermissions[module]) {
        fb.disable();
      }
    }

    roleGroup.patchValue(currentPermissions);

    this.form.addControl(role.slug, roleGroup);
  }

  public save() {
    this.state.get('roles')
      .filter((role) => !role.isAdmin)
      .forEach((role) => {
        const permissions = this.projectsSettingsFeatureRolesPermissionsService.getRoleFormGroupPermissions(this.getRoleForm(role));

        this.store.dispatch(
          updateRolePermissions({
            project: this.state.get('project').slug,
            roleSlug: role.slug,
            permissions,
          })
        );
      });
  }

  public watchFragment() {
    this.route.fragment.pipe(take(1)).subscribe((fragment) => {
      if (!fragment) {
        fragment = this.defaultFragment;
      }

      if (fragment !== this.defaultFragment) {
        this.focusFragment(fragment);
        void this.router.navigate([], {
          fragment: fragment
        });
      }
    });

    this.router.events.pipe(
      filter((evt): evt is NavigationEnd => evt instanceof NavigationEnd),
      map((evt) => evt.url.split('#')[1])
    ).subscribe((fragment) => {
      const isInternal = this.router.getCurrentNavigation()?.extras.state?.internal as boolean;

      if (!isInternal) {
        this.focusFragment(fragment);
      }
    });
  }

  public focusFragment(fragment: string) {
    const el = this.nativeElement.querySelector(`[data-fragment="${fragment}"] h3`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      (el as HTMLElement).focus({ preventScroll:true });
    }
  }

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  public isInViewport(element: HTMLElement) {
    if (element.dataset.fragment) {
      this.changeFragment(element.dataset.fragment);
    }
  }

  public changeFragment(fragment: string) {
    void this.router.navigate([], {
      fragment: fragment,
      relativeTo: this.route,
      state: {
        internal: true,
      }
    });
  }

  public trackBySlug(_index: number, role: Role) {
    return role.slug;
  }
}
