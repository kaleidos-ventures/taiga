/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { fakeAsync } from '@angular/core/testing';
import {
  SpectatorDirective,
  createDirectiveFactory,
} from '@ngneat/spectator/jest';
import { ShortcutsService } from '@taiga/core';
import { Subject } from 'rxjs';
import {
  calculateTooltipPositionByPreference,
  positionMapping,
} from './calculate-tooltip-position';
import { TooltipComponent } from './tooltip.component';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
  let spectator: SpectatorDirective<TooltipDirective>;

  const shortcurtSubject = new Subject<void>();
  const focusSubject = new Subject<FocusOrigin>();

  const createDirective = createDirectiveFactory({
    directive: TooltipDirective,
    imports: [OverlayModule, TooltipComponent, TooltipDirective],
    mocks: [ShortcutsService, FocusMonitor],
    declarations: [],
  });

  function createDirectiveWithTemplate(template: string) {
    spectator = createDirective(template, {
      detectChanges: false,
    });

    const focusMonitor = spectator.inject<FocusMonitor>(FocusMonitor);
    focusMonitor.monitor.mockReturnValue(focusSubject.asObservable());

    spectator.detectChanges();

    const shortcutsService =
      spectator.inject<ShortcutsService>(ShortcutsService);
    shortcutsService.task.mockReturnValue(
      shortcurtSubject.asObservable() as any
    );
  }

  function checkIfTooltipIsVisible() {
    return spectator.directive['overlayRef']?.hasAttached();
  }

  function getTooltip() {
    return spectator.directive['tooltipRef'];
  }

  function tooltipDescribedBy() {
    return spectator.element.getAttribute('aria-describedby');
  }

  function mouseEnterTooltipTrigger() {
    spectator.dispatchMouseEvent(spectator.element, 'mouseenter');
    spectator.detectChanges();
  }

  function mouseLeaveTooltip(relatedTarget: EventTarget | null = null) {
    spectator.dispatchMouseEvent(
      spectator.element,
      'mouseleave',
      0,
      0,
      new MouseEvent('mouseleave', {
        relatedTarget,
      })
    );

    spectator.detectChanges();
  }

  function getTooltipHTML() {
    return spectator.query(`.cdk-overlay-container tg-ui-tooltip`, {
      root: true,
    }) as HTMLElement;
  }

  it('create accesible tooltip', () => {
    createDirectiveWithTemplate(
      `<div class="app-content"><button tgUiTooltip="test"></button></div>`
    );

    const id = tooltipDescribedBy();

    expect(id).toBeTruthy();

    if (!id) {
      return;
    }

    const altTooltip = spectator.query(`#${id}`, { root: true });

    expect(altTooltip).toContainText('test');
  });

  it('tgUiTooltipCreateAccesibleTooltip false', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipCreateAccesibleTooltip]="false">
    </button></div>`);

    const id = tooltipDescribedBy();

    expect(id).toBeNull();
  });

  it('show tooltip with delay in the correct position, hide on mouseleave', fakeAsync(() => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipDelayOpen]="100"
      tgUiTooltipPosition="top-right">
    </button></div>`);

    mouseEnterTooltipTrigger();

    expect(getTooltip()).toBeFalsy();

    spectator.tick(100);

    expect(checkIfTooltipIsVisible()).toBeTruthy();

    const tooltipHTML = getTooltipHTML();
    expect(tooltipHTML).toContainText('test');
    expect(tooltipHTML.classList.contains('top-right')).toBeTruthy();

    mouseLeaveTooltip();

    expect(checkIfTooltipIsVisible()).toBeFalsy();
  }));

  it('show/hide tooltip manually', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipDelayOpen]="0">
    </button></div>`);

    spectator.directive.tgManual = true;
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeTruthy();

    const tooltipHTML = getTooltipHTML();
    expect(tooltipHTML).toContainText('test');

    spectator.directive.tgManual = false;
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeFalsy();
  });

  it('tooltip disabled', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
    tgUiTooltip="test"
    [tgUiTooltipDelayOpen]="0"
    [tgUiTooltipDisabled]="true">
  </button></div>`);
    mouseEnterTooltipTrigger();

    expect(getTooltip()).toBeFalsy();

    const id = tooltipDescribedBy();

    expect(id).toBeFalsy();
  });

  it('show tooltip. hover on tooltip, mouseleave tooltip', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipDelayOpen]="0">
    </button></div>`);

    mouseEnterTooltipTrigger();
    expect(checkIfTooltipIsVisible()).toBeTruthy();

    const tooltipHTML = getTooltipHTML();
    expect(tooltipHTML).toContainText('test');

    mouseLeaveTooltip(tooltipHTML);

    expect(checkIfTooltipIsVisible()).toBeTruthy();

    spectator.dispatchMouseEvent(getTooltipHTML(), 'mouseleave');
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeFalsy();
  });

  it('close tooltip on esc', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipDelayOpen]="0"
      [tgUiTooltipDelayClose]="0">
    </button></div>`);
    mouseEnterTooltipTrigger();
    expect(checkIfTooltipIsVisible()).toBeTruthy();

    shortcurtSubject.next();
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeFalsy();
  });

  it('show/hide tooltip on focus', () => {
    createDirectiveWithTemplate(`<div class="app-content"><button
      tgUiTooltip="test"
      [tgUiTooltipDelayOpen]="0"
      [tgUiTooltipDelayClose]="0">
    </button></div>`);

    focusSubject.next('keyboard');
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeTruthy();

    focusSubject.next(null);
    spectator.detectChanges();

    expect(checkIfTooltipIsVisible()).toBeFalsy();
  });

  it('position priorty, bottom first', () => {
    const result = calculateTooltipPositionByPreference('bottom-right');

    const keys = result.map((it) => {
      return positionMapping.find((position) => position.config === it)?.key;
    });

    expect(keys).toEqual([
      'bottom-right',
      'bottom-left',
      'bottom',
      'top-left',
      'top-right',
      'top',
    ]);
  });

  it('position priorty, top first', () => {
    const result = calculateTooltipPositionByPreference('top-right');

    const keys = result.map((it) => {
      return positionMapping.find((position) => position.config === it)?.key;
    });

    expect(keys).toEqual([
      'top-right',
      'top-left',
      'top',
      'bottom-left',
      'bottom-right',
      'bottom',
    ]);
  });
});
