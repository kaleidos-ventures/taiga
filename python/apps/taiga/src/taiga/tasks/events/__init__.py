# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga.events import events_manager
from taiga.tasks.events.content import CreateTaskContent
from taiga.tasks.models import Task
from taiga.tasks.serializers import TaskSerializer

CREATE_TASK = "tasks.create"


async def emit_event_when_task_is_created(task: Task) -> None:
    # Publish on the project channel
    if task:
        await events_manager.publish_on_project_channel(
            project=task.project, type=CREATE_TASK, content=CreateTaskContent(task=TaskSerializer.from_orm(task))
        )
