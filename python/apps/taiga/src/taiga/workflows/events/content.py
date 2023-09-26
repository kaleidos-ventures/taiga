# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.serializers import BaseModel
from taiga.workflows.serializers import (
    DeleteWorkflowSerializer,
    ReorderWorkflowStatusesSerializer,
    WorkflowSerializer,
    WorkflowStatusSerializer,
)


class CreateWorkflowContent(BaseModel):
    workflow: WorkflowSerializer


class UpdateWorkflowContent(BaseModel):
    workflow: WorkflowSerializer


class DeleteWorkflowContent(BaseModel):
    workflow: DeleteWorkflowSerializer
    target_workflow: WorkflowSerializer | None


class CreateWorkflowStatusContent(BaseModel):
    workflow_status: WorkflowStatusSerializer


class UpdateWorkflowStatusContent(BaseModel):
    workflow_status: WorkflowStatusSerializer


class ReorderWorkflowStatusesContent(BaseModel):
    reorder: ReorderWorkflowStatusesSerializer


class DeleteWorkflowStatusContent(BaseModel):
    workflow_status: WorkflowStatusSerializer
    target_status: WorkflowStatusSerializer | None
