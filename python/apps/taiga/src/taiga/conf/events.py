# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from enum import Enum

from pydantic import BaseSettings


class PubSubBackendChoices(Enum):
    MEMORY = "memory"
    REDIS = "redis"


class EventsSettings(BaseSettings):
    PUBSUB_BACKEND: PubSubBackendChoices = PubSubBackendChoices.REDIS

    # Settings for PubSubBackendChoices.MEMORY
    # -- none --

    # Settings for PubSubBackendChoices.REDIS
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USERNAME: str | None = None
    REDIS_PASSWORD: str | None = None
    REDIS_DATABASE: int = 0
