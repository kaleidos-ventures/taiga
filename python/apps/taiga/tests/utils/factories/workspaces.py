# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from .base import Factory, factory


class WorkspaceFactory(Factory):
    name = factory.Sequence(lambda n: "workspace{}".format(n))
    slug = factory.Sequence(lambda n: "workspace-{}-slug".format(n))
    color = factory.LazyAttribute(random.randrange(1, 9))
    created_date = factory.LazyAttribute(lambda o: date.today())
    modified_date = factory.LazyAttribute(lambda o: date.today())

    class Meta:
        model = "workspaces.Workspace"
