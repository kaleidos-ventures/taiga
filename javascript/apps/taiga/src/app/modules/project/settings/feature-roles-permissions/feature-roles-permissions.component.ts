/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Role } from '@taiga/data';
import { filter, map, take } from 'rxjs/operators';
import { fetchRoles } from '~/app/modules/project/data-access/+state/actions/project.actions';
import { selectRoles } from '~/app/modules/project/data-access/+state/selectors/project.selectors';
@UntilDestroy()
@Component({
  selector: 'tg-projects-settings-feature-roles-permissions',
  templateUrl: './feature-roles-permissions.component.html',
  styleUrls: [
    './feature-roles-permissions.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class ProjectsSettingsFeatureRolesPermissionsComponent implements AfterViewInit {
  public adminList: Role[] = [];

  public readonly model$ = this.state.select().pipe(
    map((model) => {
      this.form = this.fb.group({
        roles: this.fb.array([])
      });
      this.adminList = [];
      model.roles.forEach(role => {
        const roleForm = this.fb.group({
          name: new FormControl(role.name),
          numMembers: new FormControl(role.numMembers),
          order: new FormControl(role.order),
          slug: new FormControl(role.slug),
          permissions:  new FormControl(role.permissions)
        });
        if (this.roles && !role.isAdmin) {
          this.roles.push(roleForm);
        } else if (this.roles && role.isAdmin) {
          this.adminList.push(role);
        }
      });
      return {
        ...model,
      };
    }),
  );

  constructor(
    private el: ElementRef,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private store: Store,
    private state: RxState<{
      roles: Role[]
    }>,
  ) {
    this.route.pathFromRoot[2].params
      .pipe(untilDestroyed(this))
      .subscribe(params => {
        if (params) {
          const slug = params.slug as string;
          if (slug) {
            this.store.dispatch(fetchRoles({ slug }));
          }
        }
      });
    this.state.connect('roles', this.store.select(selectRoles));

  }

  public get roles() {
    return this.form.controls['roles'] as FormArray;
  }

  private readonly defaultFragment =  'member-permissions-settings';
  public form!: FormGroup;

  public basicPermissionList = [
    'Can edit',
    'Custom',
    'No Access'
  ];

  public ngAfterViewInit() {
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

  public trackByIndex(index: number) {
    return index;
  }
}
