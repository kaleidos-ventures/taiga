# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from fastapi import UploadFile
from taiga.attachments import repositories as attachments_repositories
from taiga.attachments.events import EventOnCreateCallable
from taiga.attachments.models import Attachment
from taiga.base.db.models import Model
from taiga.users.models import User

##########################################################
# create attachment
##########################################################


async def create_attachment(
    file: UploadFile,
    created_by: User,
    object: Model,
    event_on_create: EventOnCreateCallable | None = None,
) -> Attachment:
    attachment = await attachments_repositories.create_attachment(
        file=file,
        object=object,
        created_by=created_by,
    )

    if event_on_create:
        await event_on_create(attachment=attachment)

    return attachment


##########################################################
# list attachments
##########################################################


async def list_attachments(
    content_object: Model,
) -> list[Attachment]:
    return await attachments_repositories.list_attachments(
        filters={"content_object": content_object},
    )
