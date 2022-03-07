/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { ProjectMockFactory } from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';

import { randWord } from '@ngneat/falso';
import { ProjectNavigationMenuComponent } from './project-navigation-menu.component';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProjectNavigationComponent', () => {
  let spectator: Spectator<ProjectNavigationMenuComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationMenuComponent,
    imports: [getTranslocoModule(), CommonModule],
    schemas: [NO_ERRORS_SCHEMA],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });

    spectator.component.project = ProjectMockFactory(true);
  });

  it('default', () => {
    expect(spectator.component.collapseText).toEqual(true);
    expect(spectator.component.scrumChildMenuVisible).toEqual(false);
  });

  it('Collapsed icon - uncollapsed', () => {
    spectator.component.collapsed = false;
    expect(spectator.component.getCollapseIcon()).toEqual('collapseLeft');
  });

  it('Collapsed icon - collapsed', () => {
    spectator.component.collapsed = true;
    expect(spectator.component.getCollapseIcon()).toEqual('collapseRight');
  });

  it('Toggle scrum child menu - uncollapsed', () => {
    spectator.component.collapsed = false;
    spectator.component.scrumChildMenuVisible = true;
    spectator.component.toggleScrumChildMenu();
    expect(spectator.component.scrumChildMenuVisible).toBeFalsy();
  });

  it('Popup dialog event', () => {
    spectator.component.collapsed = true;
    spectator.component.initDialog = jest.fn();

    const type = randWord();
    const eventObj: any = { target: { value: 42 } };

    spectator.component.popup(eventObj, type);

    expect(spectator.component.initDialog).toHaveBeenCalledWith(
      eventObj.target,
      type
    );
  });

  it('Popup scrum event', () => {
    spectator.component.collapsed = true;
    spectator.component.initDialog = jest.fn();

    const type = 'scrum';
    const eventObj: any = { target: { value: 42 } };

    spectator.component.popupScrum(eventObj);

    expect(spectator.component.initDialog).toHaveBeenCalledWith(
      eventObj.target,
      type
    );
  });

  it('Enter dialog', () => {
    spectator.component.enterDialog();

    expect(spectator.component.dialog.open).toBeTruthy;
    expect(spectator.component.dialog.hover).toBeTruthy;
  });

  it('Out', () => {
    jest.useFakeTimers();
    spectator.component.dialog.hover = false;

    spectator.component.out();
    jest.advanceTimersByTime(100);

    expect(spectator.component.dialog.open).toBeFalsy;
    expect(spectator.component.dialog.type).toEqual('');
  });
});
