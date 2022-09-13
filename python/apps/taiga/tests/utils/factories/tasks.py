# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from asgiref.sync import sync_to_async

from .base import Factory, factory


class TaskFactory(Factory):
    name = factory.Sequence(lambda n: f"Task {n}")
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")
    workflow = factory.SubFactory("tests.utils.factories.WorkflowFactory")
    status = factory.SubFactory("tests.utils.factories.WorkflowStatusFactory")
    created_by = factory.SubFactory("tests.utils.factories.UserFactory")

    class Meta:
        model = "tasks.Task"


@sync_to_async
def create_task(**kwargs):
    return TaskFactory.create(**kwargs)


def build_task(**kwargs):
    return TaskFactory.build(**kwargs)
