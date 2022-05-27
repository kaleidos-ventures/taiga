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
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';

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
    mocks: [LocalStorageService],
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

  it('on init', () => {
    const localStorageService =
      spectator.inject<LocalStorageService>(LocalStorageService);

    const rejectedInvites = [workspaceItem.invitedProjects.at(0)?.slug];
    localStorageService.get.mockReturnValue(rejectedInvites);

    const availableInvites = workspaceItem.invitedProjects.slice(1);

    spectator.component.ngOnInit();

    expect(spectator.component.rejectedInvites).toEqual(rejectedInvites);
    expect(spectator.component.invitations.length).toEqual(
      availableInvites.length
    );
  });

  it('reject project invite', () => {
    const slug = workspaceItem.invitedProjects.at(0)!.slug;
    spectator.component.invitations = [workspaceItem.invitedProjects.at(0)!];

    spectator.component.rejectProjectInvite(slug);
    expect(spectator.component.rejectedInvites).toEqual([slug]);
    expect(spectator.component.invitations).toEqual([]);
  });

  it('Change Show All Projects', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    spectator.detectChanges();
    const action = fetchWorkspaceProjects({
      slug: spectator.component.workspace.slug,
    });

    spectator.component.setShowAllProjects(false);

    expect(dispatchSpy).toBeCalledWith(action);

    spectator.component.setShowAllProjects(false);

    expect(dispatchSpy).toBeCalledWith(action);
  });
});
