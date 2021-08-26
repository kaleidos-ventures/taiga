# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga6.base.api import serializers
from taiga6.base.fields import Field, MethodField
from taiga6.base.neighbors import NeighborsSerializerMixin

from taiga6.mdrender.service import render as mdrender
from taiga6.projects.attachments.serializers import BasicAttachmentsInfoSerializerMixin
from taiga6.projects.due_dates.serializers import DueDateSerializerMixin
from taiga6.projects.mixins.serializers import OwnerExtraInfoSerializerMixin
from taiga6.projects.mixins.serializers import ProjectExtraInfoSerializerMixin
from taiga6.projects.mixins.serializers import AssignedToExtraInfoSerializerMixin
from taiga6.projects.mixins.serializers import StatusExtraInfoSerializerMixin
from taiga6.projects.notifications.mixins import WatchedResourceSerializer
from taiga6.projects.tagging.serializers import TaggedInProjectResourceSerializer
from taiga6.projects.votes.mixins.serializers import VoteResourceSerializerMixin
from taiga6.projects.history.mixins import TotalCommentsSerializerMixin


class TaskListSerializer(VoteResourceSerializerMixin, WatchedResourceSerializer,
                         OwnerExtraInfoSerializerMixin, AssignedToExtraInfoSerializerMixin,
                         StatusExtraInfoSerializerMixin, ProjectExtraInfoSerializerMixin,
                         BasicAttachmentsInfoSerializerMixin, TaggedInProjectResourceSerializer,
                         TotalCommentsSerializerMixin, DueDateSerializerMixin,
                         serializers.LightSerializer):

    id = Field()
    user_story = Field(attr="user_story_id")
    ref = Field()
    project = Field(attr="project_id")
    milestone = Field(attr="milestone_id")
    milestone_slug = MethodField()
    created_date = Field()
    modified_date = Field()
    finished_date = Field()
    subject = Field()
    us_order = Field()
    taskboard_order = Field()
    is_iocaine = Field()
    external_reference = Field()
    version = Field()
    watchers = Field()
    is_blocked = Field()
    blocked_note = Field()
    is_closed = MethodField()
    user_story_extra_info = Field()

    def get_generated_user_stories(self, obj):
        assert hasattr(obj, "generated_user_stories_attr"),\
            "instance must have a generated_user_stories_attr attribute"
        return obj.generated_user_stories_attr

    def get_milestone_slug(self, obj):
        return obj.milestone.slug if obj.milestone else None

    def get_is_closed(self, obj):
        return obj.status is not None and obj.status.is_closed


class TaskSerializer(TaskListSerializer):
    comment = MethodField()
    generated_user_stories = MethodField()
    blocked_note_html = MethodField()
    description = Field()
    description_html = MethodField()

    def get_comment(self, obj):
        return ""

    def get_blocked_note_html(self, obj):
        return mdrender(obj.project, obj.blocked_note)

    def get_description_html(self, obj):
        return mdrender(obj.project, obj.description)


class TaskNeighborsSerializer(NeighborsSerializerMixin, TaskSerializer):
    pass
