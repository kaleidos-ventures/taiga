/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
@Component({
  selector: 'tg-projects-settings-feature-roles-permissions',
  templateUrl: './feature-roles-permissions.component.html',
  styleUrls: [
    './feature-roles-permissions.component.css',
    '../styles/settings.styles.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsSettingsFeatureRolesPermissionsComponent implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  private readonly defaultFragment =  'member-permissions-settings';

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
}
