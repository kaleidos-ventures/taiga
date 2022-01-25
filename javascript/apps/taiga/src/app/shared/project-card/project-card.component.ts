/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';

@Component({
  selector: 'tg-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
})
export class ProjectCardComponent {
  @Input()
  public placeholder = false;

  @Input()
  public slug = '';

  @Input()
  public firstProject = false;

  @Input()
  public project!: Pick<
    Project,
    'name' | 'slug' | 'description' | 'color' | 'logoSmall'
  >;
}
