/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { By } from '@angular/platform-browser';
import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator';
import { TuiButtonComponent, TuiButtonModule } from '@taiga-ui/core';
import { ButtonLoadingDirective } from './button-loading.directive';
import { ButtonLoadingModule } from './button-loading.module';
import { ButtonLoadingService } from './button-loading.service';

describe('ButtonLoadingDirective', () => {
  let spectator: SpectatorDirective<ButtonLoadingDirective>;

  const createDirective = createDirectiveFactory({
    directive: ButtonLoadingDirective,
    imports: [ButtonLoadingModule, TuiButtonModule],
    declareDirective: false,
  });

  beforeEach(() => {
    spectator = createDirective(`
    <button
      iconRight="test"
      loading
      loadingMsg="Testing"
      loadingSuccess="Tested"
      class="button-login"
      tuiButton
      appearance="primary"
      data-test="login-submit"
      type="submit">
      Test
    </button>
    `);

    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  it('success button loading', () => {
    const instance = spectator.directive;
    const element = spectator.element as HTMLElement;
    const service = spectator.inject(ButtonLoadingService);

    service.start();

    const content = element.querySelector('.t-content');

    expect(element).toHaveAttribute('disabled');
    expect(content).toContainText('Test');

    jest.advanceTimersByTime(2100);

    const button = spectator.fixture.debugElement.query(
      By.directive(TuiButtonComponent)
    );

    expect(content).toContainText('Testing .');
    expect(button.componentInstance.iconRight).toEqual('');
    expect(instance).toBeDefined();

    jest.advanceTimersByTime(1000);

    expect(content).toContainText('Testing ..');

    jest.advanceTimersByTime(1000);

    expect(content).toContainText('Testing ...');

    service.whenReady().subscribe();
    jest.runOnlyPendingTimers();

    expect(content).toContainText('Tested');
    jest.advanceTimersByTime(5100);

    expect(content).toContainText('Test');
    expect(element).not.toHaveAttribute('disabled');
    expect(button.componentInstance.iconRight).toEqual('test');
  });

  it('error button loading', () => {
    const instance = spectator.directive;
    const element = spectator.element as HTMLElement;
    const service = spectator.inject(ButtonLoadingService);

    service.start();

    const content = element.querySelector('.t-content');

    expect(element).toHaveAttribute('disabled');
    expect(content).toContainText('Test');

    jest.advanceTimersByTime(2100);

    const button = spectator.fixture.debugElement.query(
      By.directive(TuiButtonComponent)
    );

    expect(content).toContainText('Testing .');
    expect(button.componentInstance.iconRight).toEqual('');
    expect(instance).toBeDefined();

    service.error();

    expect(content).toContainText('Test');
    expect(element).not.toHaveAttribute('disabled');
    expect(button.componentInstance.iconRight).toEqual('test');
  });

  it('fast loading', () => {
    const element = spectator.element as HTMLElement;
    const service = spectator.inject(ButtonLoadingService);

    service.start();

    const content = element.querySelector('.t-content');

    expect(element).toHaveAttribute('disabled');
    expect(content).toContainText('Test');

    jest.advanceTimersByTime(100);

    const button = spectator.fixture.debugElement.query(
      By.directive(TuiButtonComponent)
    );

    service.whenReady().subscribe();
    jest.runOnlyPendingTimers();

    expect(content).toContainText('Test');
    expect(element).not.toHaveAttribute('disabled');
    expect(button.componentInstance.iconRight).toEqual('test');
  });
});
