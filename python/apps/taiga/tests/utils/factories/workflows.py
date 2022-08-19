# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL


from .base import Factory, factory


class WorkflowFactory(Factory):
    name = factory.Sequence(lambda n: f"Workflow {n}")
    slug = factory.Sequence(lambda n: f"workflow-{n}")
    order = factory.Sequence(lambda n: n)
    statuses = factory.RelatedFactoryList("tests.utils.factories.WorkflowStatusFactory", "workflow", size=3)
    project = factory.SubFactory("tests.utils.factories.ProjectFactory")

    class Meta:
        model = "workflows.Workflow"


class WorkflowStatusFactory(Factory):
    name = factory.Sequence(lambda n: f"Workflow Status {n}")
    slug = factory.Sequence(lambda n: f"workflow-status-{n}")
    color = factory.Faker("pyint", min_value=1, max_value=8)
    order = factory.Sequence(lambda n: n)
    workflow = factory.SubFactory("tests.utils.factories.WorkflowFactory", statuses=[])

    class Meta:
        model = "workflows.WorkflowStatus"


def build_workflow(**kwargs):
    return WorkflowFactory.build(**kwargs)
