/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { selectStoryView } from '../story-detail/data-access/+state/selectors/story-detail.selectors';
import { ProjectFeatureStoryWrapperSideViewComponent } from './project-feature-story-wrapper-side-view.component';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ButtonComponent', () => {
  let spectator: Spectator<ProjectFeatureStoryWrapperSideViewComponent>;
  let store: MockStore;

  const initialState = {
    showView: true,
    selectedStoryView: 'side-view',
    loadingStory: false,
  };

  const createComponent = createComponentFactory({
    component: ProjectFeatureStoryWrapperSideViewComponent,
    imports: [getTranslocoModule()],
    providers: [provideMockStore({ initialState })],
    mocks: [LocalStorageService],
    overrideComponents: [
      [
        ProjectFeatureStoryWrapperSideViewComponent,
        {
          set: {
            imports: [CommonModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
          },
        },
      ],
    ],
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent();
    store = spectator.inject(MockStore);
    store.overrideSelector(selectStoryView, 'side-view');
  });

  it('Kanban calculation without MinInlineSize restriction (width 2000px)', () => {
    spectator.component.kanbanWidth = 2000;
    spectator.component.sidebarOpen = true;

    const calculateMaxInlineSize = spectator.component.calculateMaxInlineSize();
    const calculateMinInlineSize = spectator.component.calculateMinInlineSize();

    const expectedMaxInlineSize = `${spectator.component.kanbanWidth / 2}px`;
    const expectedMinInlineSize = `${spectator.component.kanbanWidth / 4}px`;

    expect(calculateMaxInlineSize).toBe(expectedMaxInlineSize);
    expect(calculateMinInlineSize).toBe(expectedMinInlineSize);
    spectator.component.sidebarOpen = false;
    expect(calculateMaxInlineSize).toBe(expectedMaxInlineSize);
    expect(calculateMinInlineSize).toBe(expectedMinInlineSize);
  });
  it('Kanban calculation with MinInlineSize restriction (width 1000px)', () => {
    spectator.component.kanbanWidth = 1000;
    spectator.component.sidebarOpen = true;
    const calculateMaxInlineSize = spectator.component.calculateMaxInlineSize();
    const calculateMinInlineSize = spectator.component.calculateMinInlineSize();

    const expectedMaxInlineSize = `${spectator.component.kanbanWidth / 2}px`;
    const expectedMinInlineSize = `${spectator.component.minWidthUncollapsed}px`;

    expect(calculateMaxInlineSize).toBe(expectedMaxInlineSize);
    expect(calculateMinInlineSize).toBe(expectedMinInlineSize);
    spectator.component.sidebarOpen = false;
    const calculateMinInlineSizeCollapsed =
      spectator.component.calculateMinInlineSize();

    const expectedMinInlineSizeCollapsed = `${spectator.component.minWidthCollapsed}px`;
    expect(calculateMaxInlineSize).toBe(expectedMaxInlineSize);
    expect(calculateMinInlineSizeCollapsed).toBe(
      expectedMinInlineSizeCollapsed
    );
  });

  it('setInitialSidePanelWidth', () => {
    const localStorageService = spectator.inject(LocalStorageService);
    localStorageService.set('story_width', 1000);
    spectator.component.kanbanWidth = 1000;
    spectator.component.sidebarOpen = true;
    const calculatedDifference =
      spectator.component.minWidthUncollapsed -
      spectator.component.minWidthCollapsed;

    const expectedSidebarOpenSidepanelWidth =
      spectator.component.kanbanWidth / 4 + calculatedDifference;
    spectator.component.setInitialSidePanelWidth();
    expect(spectator.component.sidepanelWidth).toBe(
      expectedSidebarOpenSidepanelWidth
    );
    spectator.component.sidebarOpen = false;
    const expectedSidebarClosedSidepanelWidth =
      spectator.component.kanbanWidth / 4 - calculatedDifference;
    spectator.component.setInitialSidePanelWidth();
    expect(spectator.component.sidepanelWidth).toBe(
      expectedSidebarClosedSidepanelWidth
    );
  });
  it('checkIfForceCollapse', () => {
    spectator.component.widthToForceCollapse = 472;
    spectator.component.sidebarOpen = true;
    spectator.component.sidepanelWidth = 473;
    spectator.component.checkIfForceCollapse();
    expect(spectator.component.sidebarOpen).toBeTruthy();
    spectator.component.sidepanelWidth = 100;
    spectator.component.checkIfForceCollapse();
    expect(spectator.component.sidebarOpen).toBeFalsy();
  });
});
