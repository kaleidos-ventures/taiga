/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, HostListener } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { filter, switchMap, take } from 'rxjs';
import { PermissionsService } from '~/app/services/permissions.service';
import { A11yDragService } from '~/app/modules/project/feature-kanban/services/a11yDrag.service';
import { KanbanStoryComponent } from './kanban-story.component';

@UntilDestroy()
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tg-kanban-story',
  standalone: true,
})
export class A11yDragStoryDirective {
  @HostListener('keydown.space.prevent', ['$event'])
  public dragA11yStart(event: KeyboardEvent) {
    this.permissionService
      .hasPermissions$('story', ['modify'])
      .pipe(
        take(1),
        filter(
          (hasModifyPermissions) =>
            !this.a11yDragService.inProgress && hasModifyPermissions
        ),
        switchMap(() => {
          // prevent running A11yDragService, events, keydown space event
          event.stopImmediatePropagation();

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
