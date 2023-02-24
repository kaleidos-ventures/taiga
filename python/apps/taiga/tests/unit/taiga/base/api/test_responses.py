# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.api import responses
from taiga.workspaces.workspaces.serializers import WorkspaceDetailSerializer


def test_validate_200_response_ok(client):
    result = responses.http_status_200(model=WorkspaceDetailSerializer)
    assert result[200]["model"] == WorkspaceDetailSerializer
