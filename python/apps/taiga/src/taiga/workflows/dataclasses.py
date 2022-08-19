# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from dataclasses import dataclass


@dataclass
class WorkflowStatus:
    name: str
    slug: str
    color: int
    order: int


@dataclass
class Workflow:
    name: str
    slug: str
    order: int
    statuses: list[WorkflowStatus]
