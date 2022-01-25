/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { WorkspaceItemComponent } from './workspace-item.component';
import { WorkspaceMockFactory } from '@taiga/data';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { fetchWorkspaceProjects } from '~/app/modules/workspace/feature-list/+state/actions/workspace.actions';

describe('WorkspaceItem', () => {
  const workspaceItem = WorkspaceMockFactory();

  const initialState = {
    workspaceList: {
      workspaceProjects: {
        [workspaceItem.slug]: workspaceItem.latestProjects,
      },
    },
  };

  let spectator: Spectator<WorkspaceItemComponent>;
  const createComponent = createComponentFactory({
    component: WorkspaceItemComponent,
    imports: [],
    providers: [provideMockStore({ initialState })],
  });
  let store: MockStore;

  beforeEach(() => {
    spectator = createComponent({
      props: {
        workspace: workspaceItem,
        projectsToShow: 3,
      },
      detectChanges: false,
    });
    store = spectator.inject(MockStore);
  });

  it('Change Show All Projects', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    spectator.detectChanges();
    const action = fetchWorkspaceProjects({
      slug: spectator.component.workspace.slug,
    });

    spectator.component.setShowAllProjects(false);

    expect(dispatchSpy).toBeCalledWith(action);

    spectator.component.setShowAllProjects(true);

    expect(dispatchSpy).toBeCalledWith(action);
  });

  it('The project has to reflect at least 3 projects', (done) => {
    spectator.component.projectsToShow = 1;
    spectator.detectChanges();

    spectator.component.model$.subscribe(({ projects }) => {
      expect(projects.length).toEqual(3);
      done();
    });
  });

  it('A number between 3 to 6 projectToShow sholud return an equal number of projects ', (done) => {
    spectator.component.projectsToShow = 5;
    spectator.detectChanges();

    spectator.component.model$.subscribe(({ projects }) => {
      expect(projects.length).toEqual(5);
      done();
    });
  });

  it('The project has to reflect no more than 6 projects if its not showing all projects', (done) => {
    spectator.component.projectsToShow = 12;
    spectator.detectChanges();

    spectator.component.model$.subscribe(({ projects }) => {
      expect(projects.length).toEqual(6);
      done();
    });
  });

  it('If show all project is true, it should show all the projects ignoring projectsToShow', (done) => {
    spectator.component.setShowAllProjects(true);

    spectator.component.projectsToShow = 3;
    spectator.detectChanges();

    spectator.component.model$.subscribe(({ projects }) => {
      expect(projects.length).toEqual(workspaceItem.latestProjects.length);
      done();
    });
  });
});
