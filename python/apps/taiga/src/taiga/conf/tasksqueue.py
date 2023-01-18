# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from pydantic import BaseSettings


class TaskQueueSettings(BaseSettings):
    # We must include all the modules that define tasks.
    TASKS_MODULES_PATHS: set[str] = {
        "taiga.emails.tasks",
        "taiga.tokens.tasks",
        "taiga.users.tasks",
        "taiga.projects.projects.tasks",
    }
