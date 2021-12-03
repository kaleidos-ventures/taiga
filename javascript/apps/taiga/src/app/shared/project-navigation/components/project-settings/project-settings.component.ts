/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Project } from '@taiga/data';
import { filter } from 'rxjs/operators';
import { ProjectNavigationComponent } from '~/app/shared/project-navigation/project-navigation.component';

@UntilDestroy()
@Component({
  selector: 'tg-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSettingsComponent implements OnInit {
  @ViewChild('firstChild')
  public firstChild!: ElementRef;

  @Input()
  public project!: Project;

  @Output()
  public closeMenu = new EventEmitter<void>();

  public currentFragment: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private projectNavigationComponent: ProjectNavigationComponent,
  ){}

  public ngOnInit() {
    this.getFragment();
    this.initialFocus();
  }

  public getFragment() {
    this.route.fragment
      .pipe(untilDestroyed(this))
      .subscribe((fragment) => {
        this.currentFragment = fragment;
        this.cd.markForCheck();
      });
  }

  private initialFocus() {
    this.projectNavigationComponent.animationEvents$
      .pipe(
        filter((event) => event.toState === 'open-settings' && event.phaseName == 'done'),
        untilDestroyed(this)
      )
      .subscribe(() => {
        (this.firstChild.nativeElement as HTMLElement).focus();
      });
  }
}
