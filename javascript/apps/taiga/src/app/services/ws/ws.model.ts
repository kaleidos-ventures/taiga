/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

export interface WSResponseActionBase {
  type: 'action';
  action: {
    command: string;
    project?: string;
  };
}

export interface WSResponseActionSuccess extends WSResponseActionBase {
  status: 'ok';
  content: {
    channel: string;
  };
}

export interface WSResponseActionError extends WSResponseActionBase {
  status: 'error';
  content: {
    detail: string;
  };
}

export type WSResponseAction = WSResponseActionSuccess | WSResponseActionError;

export interface WSResponseEvent<T> {
  type: 'event';
  channel: string;
  event: {
    type: string;
    content: T;
    correlationId: string;
  };
}

export type WSResponse = WSResponseEvent<unknown> | WSResponseAction;
