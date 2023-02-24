# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

from taiga.projects.projects import serializers
from tests.utils import factories as f

#######################################################
# ProjectLogoMixin
#######################################################


def test_project_logo_mixin_serializer_with_logo():
    project = f.build_project()

    with (
        patch("taiga.projects.projects.services.get_logo_small_thumbnail_url", autospec=True) as fake_get_logo_small,
        patch("taiga.projects.projects.services.get_logo_large_thumbnail_url", autospec=True) as fake_get_logo_large,
    ):
        fake_get_logo_small.return_value = "small_logo.png"
        fake_get_logo_large.return_value = "large_logo.png"

        data = serializers.ProjectLogoMixin(logo=project.logo)

        assert data.logo == project.logo
        assert data.logo_small == "small_logo.png"
        assert data.logo_large == "large_logo.png"

        fake_get_logo_small.assert_awaited_once_with(project.logo)
        fake_get_logo_large.assert_awaited_once_with(project.logo)


def test_project_logo_mixin_serializer_without_logo():
    with (
        patch("taiga.projects.projects.services.get_logo_small_thumbnail_url", autospec=True) as fake_get_logo_small,
        patch("taiga.projects.projects.services.get_logo_large_thumbnail_url", autospec=True) as fake_get_logo_large,
    ):
        data = serializers.ProjectLogoMixin(logo=None)

        assert data.logo is None
        assert data.logo_small is None
        assert data.logo_large is None

        fake_get_logo_small.assert_not_awaited()
        fake_get_logo_large.assert_not_awaited()
