# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

from taiga.mediafiles import services
from tests.utils import factories as f


async def test_create_mediafiles():
    project = f.build_project()
    user = f.build_user()

    uploadfiles = [
        f.build_image_uploadfile(),
        f.build_image_uploadfile(),
    ]

    mediafiles = [
        f.build_mediafile(),
        f.build_mediafile(),
    ]

    with patch("taiga.mediafiles.services.mediafiles_repositories", autospec=True) as fake_mediafiles_repository:
        fake_mediafiles_repository.create_mediafiles.return_value = mediafiles
        data = await services.create_mediafiles(files=uploadfiles, project=project, object=None, created_by=user)
        fake_mediafiles_repository.create_mediafiles.assert_awaited_once_with(
            files=uploadfiles, project=project, object=None, created_by=user
        )
        assert len(data) == 2
