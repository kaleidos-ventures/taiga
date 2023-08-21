/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ComponentPortal, DomPortalOutlet } from '@angular/cdk/portal';
import {
  ApplicationRef,
  ComponentFactoryResolver,
  Injectable,
  Injector,
  TemplateRef,
  inject,
} from '@angular/core';
import { v4 } from 'uuid';
import { TooltipComponent } from './tooltip.component';
import { TooltipDirective } from './tooltip.directive';

export const CORRELATION_ID = v4();
let nextId = 0;

/**
 * This service is responsible for creating and managing the tooltip component
 * not visible for the user, just for the screen readers.
 * The component reuse the same tooltip component for the same content.
 */
@Injectable({
  providedIn: 'root',
})
export class AccesibleTooltipService {
  // deprecated: https://github.com/angular/components/issues/24334
  // eslint-disable-next-line deprecation/deprecation
  private cfr = inject(ComponentFactoryResolver);
  private appRef = inject(ApplicationRef);
  private injector = inject(Injector);
  private tooltips: {
    id: string;
    content: string | TemplateRef<unknown>;
    component: ComponentPortal<TooltipComponent>;
    references: TooltipDirective[];
    portal: DomPortalOutlet;
  }[] = [];

  public createAccesibleTooltipComponent(
    directive: TooltipDirective,
    content: string | TemplateRef<unknown>
  ) {
    const tooltip = this.tooltips.find((t) => t.content === content);

    if (tooltip) {
      return tooltip.id;
    }

    const id = `tg-ui-tooltip-${nextId++}`;
    const accesiblePortal = new DomPortalOutlet(
      document.body.getElementsByClassName('app-content')[0],
      this.cfr,
      this.appRef,
      this.injector
    );

    const tooltipPortal = new ComponentPortal(TooltipComponent);
    const tooltipRef = accesiblePortal.attach(tooltipPortal);

    if (typeof content === 'string') {
      tooltipRef.instance.text = content;
    } else {
      tooltipRef.instance.template = content;
    }

    tooltipRef.instance.id = id;
    tooltipRef.instance.visuallyHidden = true;
    tooltipRef.instance.role = 'tooltip';

    this.tooltips.push({
      id,
      content,
      component: tooltipPortal,
      references: [directive],
      portal: accesiblePortal,
    });

    return id;
  }

  public directiveDestroyed(directive: TooltipDirective) {
    this.tooltips = this.tooltips.map((t) => {
      if (t.references.includes(directive)) {
        return {
          ...t,
          references: t.references.filter((r) => r !== directive),
        };
      }

      return t;
    });

    const tooltipWithoutReferences = this.tooltips.find(
      (t) => t.references.length === 0
    );

    if (tooltipWithoutReferences) {
      this.destroyAccesibleTooltip(tooltipWithoutReferences.portal);
    }

    this.tooltips = this.tooltips.filter((t) => t.references.length > 0);
  }

  private destroyAccesibleTooltip(portal: DomPortalOutlet) {
    if (portal.hasAttached()) {
      portal.detach();
    }
  }
}
