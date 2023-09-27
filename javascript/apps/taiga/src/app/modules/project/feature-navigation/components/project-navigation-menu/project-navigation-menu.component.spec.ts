/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { randWord } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { ProjectMockFactory, UserMockFactory } from '@taiga/data';
import { Observable } from 'rxjs';
import { WsService, WsServiceMock } from '~/app/services/ws';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { ProjectNavigationMenuComponent } from './project-navigation-menu.component';

describe('ProjectNavigationComponent', () => {
  const initialState = { user: UserMockFactory() };

  let actions$: Observable<Action>;
  let spectator: Spectator<ProjectNavigationMenuComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationMenuComponent,
    imports: [getTranslocoModule(), CommonModule],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
      provideMockActions(() => actions$),
      { provide: WsService, useValue: WsServiceMock },
      provideMockStore({ initialState }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false,
    });
    spectator.component.project = ProjectMockFactory();
  });

  it('Collapsed icon - uncollapsed', () => {
    spectator.component.collapsed = false;
    expect(spectator.component.getCollapseIcon()).toEqual('collapse-left');
  });

  it('Collapsed icon - collapsed', () => {
    spectator.component.collapsed = true;
    expect(spectator.component.getCollapseIcon()).toEqual('collapse-right');
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
