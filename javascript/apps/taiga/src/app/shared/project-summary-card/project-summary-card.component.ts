/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { type Project } from '@taiga/data';
import { AvatarModule } from '@taiga/ui/avatar';
import { TranslocoModule } from '@ngneat/transloco';
import { RouterModule } from '@angular/router';
import { booleanAttribute } from '@angular/core';

@Component({
  selector: 'tg-project-summary-card',
  standalone: true,
  imports: [CommonModule, AvatarModule, TranslocoModule, RouterModule],
  templateUrl: './project-summary-card.component.html',
  styleUrls: ['./project-summary-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  @Input({ required: true })
  public project!: Project;

  @Input({ transform: booleanAttribute })
  public openInNewTab = false;
}
