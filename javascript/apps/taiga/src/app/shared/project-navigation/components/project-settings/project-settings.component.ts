/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Project } from '@taiga/data';

@UntilDestroy()
@Component({
  selector: 'tg-project-settings',
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSettingsComponent implements OnInit {
  @Input()
  public project!: Project;

  @Output()
  public closeMenu = new EventEmitter<void>();

  public currentFragment!: string;

  constructor(
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
  ){}

  public ngOnInit() {
    this.getFragment();
  }

  public getFragment() {
    this.route.fragment
      .pipe(untilDestroyed(this))
      .subscribe((fragment) => {
        if (fragment) {
          this.currentFragment = fragment;
          this.cd.markForCheck();
        }
      });
  }
}
