/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createAction, props } from '@ngrx/store';
import { Project, StoryDetail, StoryView } from '@taiga/data';

export const fetchProjectSuccess = createAction(
  '[Project] fetch success',
  props<{ project: Project }>()
);

export const fetchProject = createAction(
  '[Project] fetch',
  props<{ slug: Project['slug'] }>()
);

export const eventInvitation = createAction(
  '[Project][ws] invitation received'
);

export const revokedInvitation = createAction(
  '[Project][ws] invitation revoked'
);

export const revokedNoPermissionInvitation = createAction(
  '[Project][ws] invitation revoked and you have no permission'
);

export const permissionsUpdate = createAction(
  '[Project][ws] permission update',
  props<{ slug: Project['slug'] }>()
);

export const updateStoryShowView = createAction(
  '[Story] Update show view',
  props<{
    showView: boolean;
  }>()
);

export const fetchStory = createAction(
  '[Story] load story detail',
  props<{
    projectSlug: string;
    storyRef: number;
  }>()
);

export const fetchStorySuccess = createAction(
  '[Story] loaded story detail',
  props<{
    story: StoryDetail;
  }>()
);

export const updateStoryViewMode = createAction(
  '[Story] Update story view mode',
  props<{
    storyView: StoryView;
    previousStoryView: StoryView;
  }>()
);

export const updatedStoryViewMode = createAction(
  '[Story] story view has been updated'
);

export const clearStory = createAction('[Story] leave story detail');
