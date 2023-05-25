# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from unittest.mock import patch

import pytest
from taiga.comments import services
from tests.utils import factories as f

pytestmark = pytest.mark.django_db


#####################################################
# list_comments
#####################################################


async def test_list_comments():
    _story = await f.create_story()
    _comment = await f.create_story_comment(content_object=_story)

    _filters = {"content_object": _story}
    _select_related = ["created_by"]
    _order_by = (["-created_at"],)
    _offset = (0,)
    _limit = 100

    with (
        patch("taiga.comments.services.comment_repositories", autospec=True) as fake_comments_repository,
        patch("taiga.comments.services.comments_serializers", autospec=True) as fake_comments_serializers,
    ):

        fake_comments_repository.list_comments.return_value = [_comment]
        fake_comments_repository.get_total_comments.return_value = 1
        await services.list_paginated_comments(content_object=_story, order_by=_order_by, offset=_offset, limit=_limit)
        fake_comments_repository.list_comments.assert_awaited_once_with(
            filters=_filters,
            select_related=_select_related,
            order_by=_order_by,
            offset=_offset,
            limit=_limit,
        )
        fake_comments_repository.get_total_comments.assert_awaited_once_with(filters=_filters)
        fake_comments_serializers.serialize_comment.assert_called_once_with(comment=_comment)
