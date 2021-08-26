# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Optional

from taiga.models.projects import Project
from taiga.repositories import projects


def get_project(slug: str) -> Optional[Project]:
    return projects.get_project(slug)


def get_projects(offset: int = 0, limit: int = 100) -> list[Project]:
    return list(projects.get_projects(offset, limit))
