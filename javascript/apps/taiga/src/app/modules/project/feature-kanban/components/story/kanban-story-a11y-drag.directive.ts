/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Directive, HostListener } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { filter, switchMap, take } from 'rxjs';
import { PermissionsService } from '~/app/services/permissions.service';
import { A11yDragService } from '~/app/shared/drag/services/a11yDrag.service';
import { KanbanStoryComponent } from './kanban-story.component';

@UntilDestroy()
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tg-kanban-story',
})
export class A11yDragStoryDirective {
  @HostListener('keydown.space.prevent', ['$event'])
  public dragA11yStart() {
    this.permissionService
      .hasPermissions$('story', ['modify'])
      .pipe(
        take(1),
        filter(
          (hasModifyPermissions) =>
            !this.a11yDragService.inProgress && hasModifyPermissions
        ),
        switchMap(() => {
          return this.a11yDragService.dragStart(this.story.ref);
        })
      )
      .subscribe();
  }

  constructor(
    private a11yDragService: A11yDragService,
    private kanbanStoryComponent: KanbanStoryComponent,
    private permissionService: PermissionsService
  ) {}

  public get story() {
    return this.kanbanStoryComponent.story;
  }
}
