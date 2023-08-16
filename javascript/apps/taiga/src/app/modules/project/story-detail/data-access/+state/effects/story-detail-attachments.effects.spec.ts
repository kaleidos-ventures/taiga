/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { StoryDetailAttachmentsEffects } from './story-detail-attachments.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { hot, cold } from 'jest-marbles';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { Observable } from 'rxjs';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { AttachmentMockFactory } from '@taiga/data';
import { Action } from '@ngrx/store';

describe('StoryDetailAttachmentsEffects', () => {
  let spectator: SpectatorService<StoryDetailAttachmentsEffects>;
  let actions$: Observable<Action>;
  let effects: StoryDetailAttachmentsEffects;

  const createService = createServiceFactory({
    service: StoryDetailAttachmentsEffects,
    providers: [provideMockActions(() => actions$)],
    mocks: [ProjectApiService, AppService],
  });

  beforeEach(() => {
    spectator = createService();
    effects = spectator.service;
  });

  describe('initStory$', () => {
    it('should fetch attachments', () => {
      const action = StoryDetailActions.initStory({
        projectId: '1',
        storyRef: 1,
      });
      const responseAction = StoryDetailApiActions.fetchAttachments({
        projectId: '1',
        storyRef: 1,
      });

      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: responseAction });

      expect(effects.initStory$).toBeObservable(expected);
    });
  });

  describe('fetchAttachments$', () => {
    it('should fetch attachments and dispatch success action', () => {
      const action = StoryDetailApiActions.fetchAttachments({
        projectId: '1',
        storyRef: 1,
      });
      const attachments = [AttachmentMockFactory()];
      const successAction = StoryDetailApiActions.fetchAttachmentsSuccess({
        attachments,
      });

      const projectApiService = spectator.inject(ProjectApiService);
      projectApiService.getAttachments.mockReturnValue(
        cold('-a', { a: attachments })
      );

      actions$ = hot('-a', { a: action });
      const expected = cold('--b', { b: successAction });

      expect(effects.fetchAttachments$).toBeObservable(expected);
    });

    it('should handle an error when fetching attachments', () => {
      const appService = spectator.inject(AppService);
      const action = StoryDetailApiActions.fetchAttachments({
        projectId: '1',
        storyRef: 1,
      });

      const errorResponse = new HttpErrorResponse({});
      const projectApiService = spectator.inject(ProjectApiService);
      projectApiService.getAttachments.mockReturnValue(
        cold('-#|', {}, errorResponse)
      );

      actions$ = hot('-a', { a: action });
      const expected = cold('-|');

      expect(effects.fetchAttachments$).toSatisfyOnFlush(() => {
        expect(effects.fetchAttachments$).toBeObservable(expected);
        expect(appService.toastGenericError).toHaveBeenCalledWith(
          errorResponse
        );
      });
    });
  });

  describe('uploadAttachments$', () => {
    it('should upload attachments and dispatch success and progress actions', () => {
      const file = new File([''], 'file1.txt', {
        type: 'text/plain',
      });

      const action = StoryDetailActions.uploadAttachments({
        projectId: '1',
        storyRef: 1,
        files: [file],
      });

      const attachment = AttachmentMockFactory();

      const eventResponseProgress = {
        type: HttpEventType.UploadProgress,
        loaded: 50,
        total: 100,
      };
      const eventResponseSuccess = {
        type: HttpEventType.Response,
        body: attachment,
      };

      const projectApiService = spectator.inject(ProjectApiService);
      projectApiService.uploadAttachment.mockReturnValue(
        cold('-a-b', { a: eventResponseProgress, b: eventResponseSuccess })
      );

      actions$ = hot('-a', { a: action });
      const expected = cold('--b-c', {
        b: StoryDetailApiActions.uploadingAttachments({
          file: expect.any(String),
          name: 'file1.txt',
          progress: 50,
          contentType: 'text/plain',
        }),
        c: StoryDetailApiActions.uploadAttachmentSuccess({
          attachment,
        }),
      });

      expect(effects.uploadAttachments$).toBeObservable(expected);
    });

    it('should handle an error when uploading attachments', () => {
      const appService = spectator.inject(AppService);
      const file = new File([''], 'file1.txt');
      const action = StoryDetailActions.uploadAttachments({
        projectId: '1',
        storyRef: 1,
        files: [file],
      });

      const errorResponse = new HttpErrorResponse({});
      const projectApiService = spectator.inject(ProjectApiService);
      projectApiService.uploadAttachment.mockReturnValue(
        cold('-#|', {}, errorResponse)
      );

      actions$ = hot('-a', { a: action });
      const expected = cold('-|');

      expect(effects.uploadAttachments$).toSatisfyOnFlush(() => {
        expect(effects.uploadAttachments$).toBeObservable(expected);
        expect(appService.toastGenericError).toHaveBeenCalledWith(
          errorResponse
        );
      });
    });
  });
});
