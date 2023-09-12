/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, Inject } from '@angular/core';
import {
  TuiPoint,
  TuiPositionAccessor,
  tuiAsPositionAccessor,
} from '@taiga-ui/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[kanbanWorkflowMenuPosition]',
  providers: [tuiAsPositionAccessor(ProjectNavWorkflowMenuPositionDirective)],
  standalone: true,
})
export class ProjectNavWorkflowMenuPositionDirective extends TuiPositionAccessor {
  public readonly type = 'dropdown';

  constructor(
    @Inject(ElementRef) private readonly el: ElementRef<HTMLElement>
  ) {
    super();
  }

  public getPosition(): TuiPoint {
    const { right, top } = this.el.nativeElement.getBoundingClientRect();

    const spacing = 4; //4px

    return [top + spacing, right + spacing * 2];
  }
}
