/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { Project, ProjectMockFactory } from '@taiga/data';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { ProjectNavigationComponent } from './project-navigation.component';
import { ProjectNavigationModule } from './project-navigation.module';

import * as faker from 'faker';

describe('ProjectNavigationComponent', () => {
  let spectator: Spectator<ProjectNavigationComponent>;
  const createComponent = createComponentFactory({
    component: ProjectNavigationComponent,
    imports: [
      getTranslocoModule(),
      ProjectNavigationModule
    ],
    declareComponent: false,
    mocks: [
      LocalStorageService,
    ]
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false
    });

  });

  it('example', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(true);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - true', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(true);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(true);
  });

  it('on init check if project navigation bar is collapsed - false', () => {
    const localStorageService = spectator.inject<LocalStorageService>(LocalStorageService);
    localStorageService.get.mockReturnValue(false);

    spectator.detectChanges();

    expect(spectator.component.collapsed).toEqual(false);
  });

  it('return milestones that are not closed', () => {
    const includeMilestones = true;
    const project: Project = ProjectMockFactory(includeMilestones);

    spectator.component.project = project;

    const openMilestones = project.milestones.filter((milestone) => !milestone.closed).reverse().slice(0, 7);

    expect(spectator.component.milestones).toEqual(openMilestones);
    expect(spectator.component.milestones.length).toBeLessThanOrEqual(7);
  });

  it('toggle project navigation menu collapse', () => {
    spectator.component.collapsed = true;
    expect(spectator.component.scrumChildMenuVisible).toBeFalsy();
  });

  it('Collapsed icon - uncollapsed', () => {
    spectator.component.collapsed = false;
    const url = 'assets/icons/sprite.svg';
    expect(spectator.component.getCollapseIcon()).toEqual(`${url}#collapse-left`);
  });

  it('Collapsed icon - collapsed', () => {
    spectator.component.collapsed = true;
    const url = 'assets/icons/sprite.svg';
    expect(spectator.component.getCollapseIcon()).toEqual(`${url}#collapse-right`);
  });

  it('Toggle scrum child menu - uncollapsed', () => {
    spectator.component.collapsed = false;
    spectator.component.scrumChildMenuVisible = true;
    spectator.component.toggleScrumChildMenu();
    expect(spectator.component.scrumChildMenuVisible).toBeFalsy();
  });

  // TODO -> Cannot read property 'nativeElement' of undefined
  xit('Toggle scrum child menu - collapsed', () => {
    // spectator.component.collapsed = true;
    // spectator.component.scrumChildMenuVisible = true;
    // spectator.component.toggleScrumChildMenu();
  });

  it('Popup dialog event', () => {
    spectator.component.collapsed = true;
    spectator.component.initDialog = jest.fn();

    const type = faker.datatype.string();
    const eventObj: any = { target: { value: 42 }};

    spectator.component.popup(eventObj, type);

    expect(spectator.component.initDialog).toHaveBeenCalledWith(eventObj.target, type);
  });

  it('Popup scrum event', () => {
    spectator.component.collapsed = true;
    spectator.component.initDialog = jest.fn();

    const type = 'scrum';
    const eventObj: any = { target: { value: 42 }};

    spectator.component.popupScrum(eventObj);

    expect(spectator.component.initDialog).toHaveBeenCalledWith(eventObj.target, type);
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

  // TODO -> Exceeded timeout of 5000 ms for a hook
  xit('Out dialog', () => {

    spectator.component.out = jest.fn();
    spectator.component.outDialog();

    expect(spectator.component.dialog.hover).toBeFalsy;
    expect(spectator.component.out).toHaveBeenCalled();
  });

  // TODO -> Cannot read property 'nativeElement' of undefined
  xit('Out dialog - backlog', () => {

    spectator.component.outDialog('backlog');

    expect(spectator.component.dialog.hover).toBeFalsy;
    expect(spectator.component.backlogButtonElement.nativeElement).toBeFocused;
    expect(spectator.component.out).toHaveBeenCalled();
  });

  // TODO -> Exceeded timeout of 5000 ms for a hook
  xit('Init dialog - generic', () => {
    jest.useFakeTimers();

    const menuName = faker.datatype.string();
    const el: HTMLElement = document.createElement('div');
    el.setAttribute('data-text', menuName);
    const type = faker.datatype.string();

    jest.runAllTimers();

    spectator.component.initDialog(el, type);

    expect(spectator.component.dialog.link).toEqual('http://taiga.io');
    expect(spectator.component.dialog.hover).toBeFalsy;
    expect(spectator.component.dialog.open).toBeTruthy;
    expect(spectator.component.dialog.text).toEqual(menuName);
    expect(spectator.component.dialog.children).toEqual([]);
    expect(spectator.component.dialog.type).toEqual(type);
    expect(spectator.component.dialog.left).toEqual(48);

  });

});

