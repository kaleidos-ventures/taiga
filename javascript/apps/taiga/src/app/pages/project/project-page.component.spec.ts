/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { selectProject } from '@/app/features/project/selectors/project.selectors';
import { ProjectNavigationComponent } from '@/app/shared/project-navigation/project-navigation.component';
import { By } from '@angular/platform-browser';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import * as faker from 'faker';
import { ProjectPageComponent } from './project-page.component';
import { ProjectPageModule } from './project-page.module';

const initialState = { 
  project: {
    id: 0,
    slug: '',
    children: []
  } 
};
describe('ProjectPageComponent', () => {
  let spectator: Spectator<ProjectPageComponent>;
  let store: MockStore;

  const createComponent = createComponentFactory({
    component: ProjectPageComponent,
    imports: [ProjectPageModule],
    declareComponent: false,
    providers: [
      provideMockStore({ initialState }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      detectChanges: false
    });

    store = spectator.inject(MockStore);
  });

  it('should pass data to child', () => {

    const project = {
      id: 1,
      slug: 'test',
      milestones: []
    };

    // mock selector
    store.overrideSelector(selectProject, project);

    // trigger emission from all selectors
    store.refreshState();
    spectator.detectChanges();

    // This test checks that the input attribute name becomes a class in the component structure
    const childComponentEl = spectator.debugElement.query(By.directive(ProjectNavigationComponent));
    const projectNavigation: ProjectNavigationComponent = childComponentEl.componentInstance;
    expect(projectNavigation.project).toBe(project);
  });

});
