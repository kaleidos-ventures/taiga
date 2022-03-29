# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from asgiref.sync import sync_to_async
from taiga.invitations.models import Invitation


@sync_to_async
def create_invitations(objs: list[Invitation]) -> list[Invitation]:
    """
    This repository create invitations in bulk
    """
    return Invitation.objects.bulk_create(objs=objs)
