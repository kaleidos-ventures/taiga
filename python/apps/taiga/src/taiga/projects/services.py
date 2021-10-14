# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL
from functools import partial
from typing import Iterable, Optional, Union

from django.core.files import File
from fastapi import UploadFile
from taiga.base.utils.images import get_thumbnail_url
from taiga.conf import settings
from taiga.projects import repositories as projects_repo
from taiga.projects.models import Project
from taiga.users.models import User
from taiga.workspaces.models import Workspace


def get_projects(workspace_slug: str) -> Iterable[Project]:
    return projects_repo.get_projects(workspace_slug=workspace_slug)


def create_project(
    workspace: Workspace,
    name: str,
    description: Optional[str],
    color: Optional[int],
    owner: User,
    logo: Optional[UploadFile] = None,
) -> Project:
    logo_file = None
    if logo:
        logo_file = File(file=logo.file, name=logo.filename)

    return projects_repo.create_project(
        workspace=workspace, name=name, description=description, color=color, owner=owner, logo=logo_file
    )


def get_project(slug: str) -> Optional[Project]:
    return projects_repo.get_project(slug=slug)


def get_logo_thumbnail_url(thumbnailer_size: str, logo_relative_path: str) -> Union[str, None]:
    if logo_relative_path:
        return get_thumbnail_url(logo_relative_path, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
    return None


get_logo_small_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_SMALL)
get_logo_large_thumbnail_url = partial(get_logo_thumbnail_url, settings.IMAGES.THUMBNAIL_PROJECT_LOGO_LARGE)
