/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { TooltipPosition } from './tooltip-position.model';
@Component({
  selector: 'tg-ui-tooltip',
  template: `
    <div class="container">
      <p *ngIf="text">{{ text }}</p>
      <ng-container
        *ngIf="template"
        [ngTemplateOutlet]="template"></ng-container>
    </div>
  `,
  imports: [CommonModule],
  styleUrls: ['./tooltip.component.css'],
  standalone: true,
})
export class TooltipComponent {
  @Input()
  public text?: string;

  @Input()
  public template?: TemplateRef<unknown>;

  @HostBinding('class')
  @Input()
  public position?: TooltipPosition;

  @HostBinding('attr.id')
  @Input()
  public id?: string;

  @HostBinding('attr.role')
  @Input()
  public role?: string;

  @HostBinding('class.pointer-events')
  @Input()
  public staysOpenOnHover = true;

  @Output()
  public readonly leaveTooltip = new EventEmitter<MouseEvent>();

  @HostBinding('class.visually-hidden')
  public visuallyHidden = false;

  @HostListener('mouseleave', ['$event'])
  public onMouseLeave(event: MouseEvent) {
    this.leaveTooltip.emit(event);
  }
}
