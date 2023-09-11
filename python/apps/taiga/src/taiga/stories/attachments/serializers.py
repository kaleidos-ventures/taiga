# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Type

from pydantic import AnyHttpUrl
from taiga.attachments.serializers import AttachmentSerializer
from taiga.commons.urls import reverse


class StoryAttachmentSerializer(AttachmentSerializer):
    file: AnyHttpUrl

    @classmethod
    def from_orm(cls: Type["StoryAttachmentSerializer"], obj: Any) -> "StoryAttachmentSerializer":
        if not isinstance(obj, list):
            obj.file = reverse(
                "project.story.attachments.file",
                project_id=obj.content_object.project.b64id,
                ref=obj.content_object.ref,
                attachment_id=obj.b64id,
                filename=obj.name,
            )
        return super().from_orm(obj)
