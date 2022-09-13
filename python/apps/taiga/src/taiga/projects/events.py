# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga import events
from taiga.projects.models import Project

PROJECT_PERMISSIONS_UPDATE = "projects.permissions.update"


async def emit_event_when_project_permissions_are_updated(project: Project) -> None:
    """
    This event is emitted whenever there's a change in the project's direct permissions (public / workspace permissions)
    :param project: The project affected by the permission change
    """
    await events.events_manager.publish_on_project_channel(project=project.slug, type=PROJECT_PERMISSIONS_UPDATE)
