/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TuiSvgModule } from '@taiga-ui/core';
import { Project } from '@taiga/data';
import { AvatarModule } from '@taiga/ui/avatar';
import { filter, take } from 'rxjs/operators';
import { ProjectNavigationComponent } from '~/app/modules/project/feature-navigation/project-feature-navigation.component';
import { CommonTemplateModule } from '~/app/shared/common-template.module';
import { RouteHistoryService } from '~/app/shared/route-history/route-history.service';

@UntilDestroy()
@Component({
  selector: 'tg-project-navigation-settings',
  standalone: true,
  templateUrl: './project-navigation-settings.component.html',
  styleUrls: ['./project-navigation-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TuiSvgModule, CommonTemplateModule, AvatarModule, RouterModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'project_settings',
        alias: 'project_settings',
      },
    },
  ],
})
export class ProjectNavigationSettingsComponent implements OnInit {
  @Input()
  public project!: Project;

  @Output()
  public closeMenu = new EventEmitter<void>();

  @ViewChild('firstChild')
  public set firstChild(el: ElementRef | undefined) {
    if (el) {
      this.projectNavigationComponent.animationEvents$
        .pipe(
          filter(
            (event) =>
              event.toState === 'open-settings' && event.phaseName == 'done'
          ),
          take(1)
        )
        .subscribe(() => {
          (el.nativeElement as HTMLElement).focus();
        });
    }
  }

  public currentFragment: string | null = null;
  public previousUrl?: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private projectNavigationComponent: ProjectNavigationComponent,
    private routeHistory: RouteHistoryService
  ) {}

  public ngOnInit() {
    this.getFragment();
    this.getHistoryNav();
  }

  public getHistoryNav() {
    this.previousUrl =
      this.routeHistory.getPreviousUrl() || this.getRouter().url;
    if (this.previousUrl.includes('/settings')) {
      const id: string = this.route.snapshot.params.id;
      const slug: string = this.route.snapshot.params.slug;
      this.previousUrl = `/project/${id}/${slug}`;
    }
  }

  public navigateBack() {
    this.closeMenu.next();
    void this.getRouter().navigate([this.previousUrl]);
  }

  public getFragment() {
    this.route.fragment.pipe(untilDestroyed(this)).subscribe((fragment) => {
      this.currentFragment = fragment;
      this.cd.markForCheck();
    });
  }

  public getRouter() {
    return this.router;
  }
}
