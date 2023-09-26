/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoDirective } from '@ngneat/transloco';
import { TuiSvgModule } from '@taiga-ui/core';

type BreadCrumbType = 'expanded' | 'collapsed';

@Component({
  selector: 'tg-ui-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, TranslocoDirective, TuiSvgModule],
})
export class BreadcrumbComponent {
  @Input({ required: true }) public crumbs: string[] = [];
  @Input() public icon = 'kanban';
  @Input() public accent = false;
  @Input() public type: BreadCrumbType = 'expanded';
  @Input() public hideLastCrumb = false;

  public trackByIndex(index: number) {
    return index;
  }
}
