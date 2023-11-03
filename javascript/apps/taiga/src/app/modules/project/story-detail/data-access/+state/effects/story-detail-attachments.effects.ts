/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  StoryDetailActions,
  StoryDetailApiActions,
} from '../actions/story-detail.actions';
import { EMPTY, catchError, map, merge, mergeMap } from 'rxjs';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { ProjectApiService } from '@taiga/api';
import { AppService } from '~/app/services/app.service';
import { fetch, pessimisticUpdate } from '@ngrx/router-store/data-persistence';
import { filterNil } from '~/app/shared/utils/operators';
import { v4 } from 'uuid';
@Injectable()
export class StoryDetailAttachmentsEffects {
  private actions$ = inject(Actions);
  private projectApiService = inject(ProjectApiService);
  private appService = inject(AppService);

  public initStory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.initStory),
      map((action) => {
        return StoryDetailApiActions.fetchAttachments({
          projectId: action.projectId,
          storyRef: action.storyRef,
        });
      })
    );
  });

  public fetchAttachments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailApiActions.fetchAttachments),
      fetch({
        run: ({ projectId, storyRef }) => {
          return this.projectApiService
            .getAttachments(projectId, storyRef)
            .pipe(
              map((attachments) => {
                return StoryDetailApiActions.fetchAttachmentsSuccess({
                  attachments,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          if (httpResponse.status !== 404) {
            this.appService.toastGenericError(httpResponse);
          }
        },
      })
    );
  });

  public uploadAttachments$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.uploadAttachments),
      mergeMap((action) => {
        const uploadObservables = action.files.map((file) => {
          const uploadingId = v4();
          return this.projectApiService
            .uploadAttachment(action.projectId, action.storyRef, file)
            .pipe(
              map((event) => {
                if (event.type === HttpEventType.Response && event.body) {
                  return StoryDetailApiActions.uploadAttachmentSuccess({
                    attachment: event.body,
                  });
                } else if (
                  event.type === HttpEventType.UploadProgress &&
                  event.total
                ) {
                  return StoryDetailApiActions.uploadingAttachments({
                    file: uploadingId,
                    name: file.name,
                    contentType: file.type,
                    progress: Math.round((100 * event.loaded) / event.total),
                  });
                }

                return null;
              }),
              filterNil()
            );
        });

        return merge(...uploadObservables).pipe(
          catchError((httpResponse: HttpErrorResponse) => {
            this.appService.toastGenericError(httpResponse);

            return EMPTY;
          })
        );
      })
    );
  });

  public deleteAttachment$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(StoryDetailActions.deleteAttachment),
      pessimisticUpdate({
        run: (action) => {
          return this.projectApiService
            .deleteAttachment(action.projectId, action.storyRef, action.id)
            .pipe(
              map(() => {
                return StoryDetailApiActions.deleteAttachmentSuccess({
                  id: action.id,
                });
              })
            );
        },
        onError: (_, httpResponse: HttpErrorResponse) => {
          this.appService.toastGenericError(httpResponse);
        },
      })
    );
  });
}
