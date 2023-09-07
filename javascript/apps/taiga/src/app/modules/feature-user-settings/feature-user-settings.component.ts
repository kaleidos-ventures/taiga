/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Component, ElementRef } from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import { auditTime, fromEvent, take, withLatestFrom } from 'rxjs';
import { WatchElementService } from '~/app/shared/directives/watch-element/watch-element.service';
import { inViewport } from '~/app/shared/utils/in-viewport';
import { filterNil } from '~/app/shared/utils/operators';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@ngneat/transloco';
import { TitleComponent } from '~/app/shared/title/title.component';

@UntilDestroy()
@Component({
  selector: 'tg-feature-user-settings',
  templateUrl: './feature-user-settings.component.html',
  styleUrls: ['./feature-user-settings.component.css'],
  providers: [RxState],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    TitleComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
})
export class FeatureUserSettingsComponent {
  public readonly model$ = this.state.select();

  public get nativeElement() {
    return this.el.nativeElement as HTMLElement;
  }

  constructor(
    private router: Router,
    private watchElementService: WatchElementService,
    private el: ElementRef,
    private route: ActivatedRoute,
    private state: RxState<{
      currentFragment: string | null;
    }>
  ) {
    this.state.connect('currentFragment', this.route.fragment);
    this.watchFragment();
  }

  private watchFragment() {
    this.state.hold(this.route.fragment.pipe(filterNil()), (fragment) => {
      this.watchElementService
        .watchId(fragment)
        .pipe(filterNil(), take(1))
        .subscribe(() => {
          const isInternal = this.router.getCurrentNavigation()?.extras.state
            ?.internal as boolean;

          // ignore if the event came from scroll
          if (!isInternal) {
            const el = this.nativeElement.querySelector<HTMLElement>(
              `[data-fragment="${fragment}"]`
            );

            if (el) {
              el.scrollIntoView();
              el.focus({ preventScroll: true });
            }
          }
        });
    });

    fromEvent(window, 'scroll')
      .pipe(
        untilDestroyed(this),
        withLatestFrom(this.route.fragment),
        auditTime(200)
      )
      .subscribe(([, fragment]) => {
        const fragments: HTMLElement[] = Array.from(
          document.querySelectorAll('[data-fragment]')
        );

        const viewPortFragments = fragments.filter((el) => {
          return inViewport(el);
        });

        const viewportFragment = viewPortFragments[0];

        if (
          viewportFragment?.dataset.fragment &&
          viewportFragment.dataset.fragment !== fragment
        ) {
          void this.router.navigate([], {
            fragment: viewportFragment.dataset.fragment,
            state: {
              internal: true,
            },
          });
        }
      });
  }
}
