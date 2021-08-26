# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from taiga6.base import routers
from django.conf import settings

router = routers.DefaultRouter(trailing_slash=False)

# Locales
from taiga6.locale.api import LocalesViewSet

router.register(r"locales", LocalesViewSet, base_name="locales")


# Users & Roles
from taiga6.auth.api import AuthViewSet
from taiga6.users.api import UsersViewSet
from taiga6.users.api import RolesViewSet

router.register(r"auth", AuthViewSet, base_name="auth")
router.register(r"users", UsersViewSet, base_name="users")
router.register(r"roles", RolesViewSet, base_name="roles")


# User Storage
from taiga6.userstorage.api import StorageEntriesViewSet

router.register(r"user-storage", StorageEntriesViewSet, base_name="user-storage")


# Notifications & Notify policies
from taiga6.projects.notifications.api import NotifyPolicyViewSet
from taiga6.projects.notifications.api import WebNotificationsViewSet

router.register(r"notify-policies", NotifyPolicyViewSet, base_name="notifications")
router.register(r"web-notifications", WebNotificationsViewSet, base_name="web-notifications")
router.register(r"web-notifications/set-as-read", WebNotificationsViewSet, base_name="web-notifications")
router.register(r"web-notifications/(?P<resource_id>\d+)/set-as-read", WebNotificationsViewSet, base_name="web-notifications")

# Project settings
from taiga6.projects.settings.api import UserProjectSettingsViewSet, SectionsViewSet

router.register(r"user-project-settings", UserProjectSettingsViewSet, base_name="user-project-settings")
router.register(r"sections", SectionsViewSet, base_name="sections")


# Projects & Selectors
from taiga6.projects.api import ProjectViewSet
from taiga6.projects.api import ProjectFansViewSet
from taiga6.projects.api import ProjectWatchersViewSet
from taiga6.projects.api import MembershipViewSet
from taiga6.projects.api import InvitationViewSet
from taiga6.projects.api import EpicStatusViewSet
from taiga6.projects.api import UserStoryStatusViewSet
from taiga6.projects.api import PointsViewSet
from taiga6.projects.api import SwimlaneViewSet
from taiga6.projects.api import SwimlaneUserStoryStatusViewSet
from taiga6.projects.api import UserStoryDueDateViewSet
from taiga6.projects.api import TaskStatusViewSet
from taiga6.projects.api import TaskDueDateViewSet
from taiga6.projects.api import IssueStatusViewSet
from taiga6.projects.api import IssueTypeViewSet
from taiga6.projects.api import IssueDueDateViewSet
from taiga6.projects.api import PriorityViewSet
from taiga6.projects.api import SeverityViewSet
from taiga6.projects.api import ProjectTemplateViewSet

router.register(r"projects", ProjectViewSet, base_name="projects")
router.register(r"projects/(?P<resource_id>\d+)/fans", ProjectFansViewSet, base_name="project-fans")
router.register(r"projects/(?P<resource_id>\d+)/watchers", ProjectWatchersViewSet, base_name="project-watchers")
router.register(r"project-templates", ProjectTemplateViewSet, base_name="project-templates")
router.register(r"memberships", MembershipViewSet, base_name="memberships")
router.register(r"invitations", InvitationViewSet, base_name="invitations")
router.register(r"epic-statuses", EpicStatusViewSet, base_name="epic-statuses")
router.register(r"userstory-statuses", UserStoryStatusViewSet, base_name="userstory-statuses")
router.register(r"points", PointsViewSet, base_name="points")
router.register(r"swimlanes", SwimlaneViewSet, base_name="swimlanes")
router.register(r"swimlane-userstory-statuses", SwimlaneUserStoryStatusViewSet, base_name="swimlane-userstory-statuses")
router.register(r"userstory-due-dates", UserStoryDueDateViewSet, base_name="userstory-due-dates")
router.register(r"task-statuses", TaskStatusViewSet, base_name="task-statuses")
router.register(r"task-due-dates", TaskDueDateViewSet, base_name="task-due-dates")
router.register(r"issue-statuses", IssueStatusViewSet, base_name="issue-statuses")
router.register(r"issue-types", IssueTypeViewSet, base_name="issue-types")
router.register(r"issue-due-dates", IssueDueDateViewSet, base_name="issue-due-dates")
router.register(r"priorities", PriorityViewSet, base_name="priorities")
router.register(r"severities",SeverityViewSet , base_name="severities")


# Custom Attributes
from taiga6.projects.custom_attributes.api import EpicCustomAttributeViewSet
from taiga6.projects.custom_attributes.api import UserStoryCustomAttributeViewSet
from taiga6.projects.custom_attributes.api import TaskCustomAttributeViewSet
from taiga6.projects.custom_attributes.api import IssueCustomAttributeViewSet

from taiga6.projects.custom_attributes.api import EpicCustomAttributesValuesViewSet
from taiga6.projects.custom_attributes.api import UserStoryCustomAttributesValuesViewSet
from taiga6.projects.custom_attributes.api import TaskCustomAttributesValuesViewSet
from taiga6.projects.custom_attributes.api import IssueCustomAttributesValuesViewSet

router.register(r"epic-custom-attributes", EpicCustomAttributeViewSet,
                base_name="epic-custom-attributes")
router.register(r"userstory-custom-attributes", UserStoryCustomAttributeViewSet,
                base_name="userstory-custom-attributes")
router.register(r"task-custom-attributes", TaskCustomAttributeViewSet,
                base_name="task-custom-attributes")
router.register(r"issue-custom-attributes", IssueCustomAttributeViewSet,
                base_name="issue-custom-attributes")

router.register(r"epics/custom-attributes-values", EpicCustomAttributesValuesViewSet,
                base_name="epic-custom-attributes-values")
router.register(r"userstories/custom-attributes-values", UserStoryCustomAttributesValuesViewSet,
                base_name="userstory-custom-attributes-values")
router.register(r"tasks/custom-attributes-values", TaskCustomAttributesValuesViewSet,
                base_name="task-custom-attributes-values")
router.register(r"issues/custom-attributes-values", IssueCustomAttributesValuesViewSet,
                base_name="issue-custom-attributes-values")


# Search
from taiga6.searches.api import SearchViewSet

router.register(r"search", SearchViewSet, base_name="search")


# Resolver
from taiga6.projects.references.api import ResolverViewSet

router.register(r"resolver", ResolverViewSet, base_name="resolver")


# Attachments
from taiga6.projects.attachments.api import EpicAttachmentViewSet
from taiga6.projects.attachments.api import UserStoryAttachmentViewSet
from taiga6.projects.attachments.api import IssueAttachmentViewSet
from taiga6.projects.attachments.api import TaskAttachmentViewSet
from taiga6.projects.attachments.api import WikiAttachmentViewSet

router.register(r"epics/attachments", EpicAttachmentViewSet,
                base_name="epic-attachments")
router.register(r"userstories/attachments", UserStoryAttachmentViewSet,
                base_name="userstory-attachments")
router.register(r"tasks/attachments", TaskAttachmentViewSet,
                base_name="task-attachments")
router.register(r"issues/attachments", IssueAttachmentViewSet,
                base_name="issue-attachments")
router.register(r"wiki/attachments", WikiAttachmentViewSet,
                base_name="wiki-attachments")


# Project components
from taiga6.projects.milestones.api import MilestoneViewSet
from taiga6.projects.milestones.api import MilestoneWatchersViewSet

from taiga6.projects.epics.api import EpicViewSet
from taiga6.projects.epics.api import EpicRelatedUserStoryViewSet
from taiga6.projects.epics.api import EpicVotersViewSet
from taiga6.projects.epics.api import EpicWatchersViewSet

from taiga6.projects.userstories.api import UserStoryViewSet
from taiga6.projects.userstories.api import UserStoryVotersViewSet
from taiga6.projects.userstories.api import UserStoryWatchersViewSet

from taiga6.projects.tasks.api import TaskViewSet
from taiga6.projects.tasks.api import TaskVotersViewSet
from taiga6.projects.tasks.api import TaskWatchersViewSet

from taiga6.projects.issues.api import IssueViewSet
from taiga6.projects.issues.api import IssueVotersViewSet
from taiga6.projects.issues.api import IssueWatchersViewSet

from taiga6.projects.wiki.api import WikiViewSet
from taiga6.projects.wiki.api import WikiLinkViewSet
from taiga6.projects.wiki.api import WikiWatchersViewSet

router.register(r"milestones", MilestoneViewSet,
                base_name="milestones")
router.register(r"milestones/(?P<resource_id>\d+)/watchers", MilestoneWatchersViewSet,
                base_name="milestone-watchers")

router.register(r"epics", EpicViewSet, base_name="epics")\
      .register(r"related_userstories", EpicRelatedUserStoryViewSet,
                base_name="epics-related-userstories",
                parents_query_lookups=["epic"])

router.register(r"epics/(?P<resource_id>\d+)/voters", EpicVotersViewSet,
                base_name="epic-voters")
router.register(r"epics/(?P<resource_id>\d+)/watchers", EpicWatchersViewSet,
                base_name="epic-watchers")

router.register(r"userstories", UserStoryViewSet,
                base_name="userstories")
router.register(r"userstories/(?P<resource_id>\d+)/voters", UserStoryVotersViewSet,
                base_name="userstory-voters")
router.register(r"userstories/(?P<resource_id>\d+)/watchers", UserStoryWatchersViewSet,
                base_name="userstory-watchers")

router.register(r"tasks", TaskViewSet,
                base_name="tasks")
router.register(r"tasks/(?P<resource_id>\d+)/voters", TaskVotersViewSet,
                base_name="task-voters")
router.register(r"tasks/(?P<resource_id>\d+)/watchers", TaskWatchersViewSet,
                base_name="task-watchers")

router.register(r"issues", IssueViewSet,
                base_name="issues")
router.register(r"issues/(?P<resource_id>\d+)/voters", IssueVotersViewSet,
                base_name="issue-voters")
router.register(r"issues/(?P<resource_id>\d+)/watchers", IssueWatchersViewSet,
                base_name="issue-watchers")

router.register(r"wiki", WikiViewSet,
                base_name="wiki")
router.register(r"wiki/(?P<resource_id>\d+)/watchers", WikiWatchersViewSet,
                base_name="wiki-watchers")
router.register(r"wiki-links", WikiLinkViewSet,
                base_name="wiki-links")


# Delete owned projects
from taiga6.projects.api import DeleteOwnProjectsViewSet

router.register(r"delete-owned-projects", DeleteOwnProjectsViewSet,
                base_name="delete-owned-projects")


# History & Components
from taiga6.projects.history.api import EpicHistory
from taiga6.projects.history.api import UserStoryHistory
from taiga6.projects.history.api import TaskHistory
from taiga6.projects.history.api import IssueHistory
from taiga6.projects.history.api import WikiHistory

router.register(r"history/epic", EpicHistory, base_name="epic-history")
router.register(r"history/userstory", UserStoryHistory, base_name="userstory-history")
router.register(r"history/task", TaskHistory, base_name="task-history")
router.register(r"history/issue", IssueHistory, base_name="issue-history")
router.register(r"history/wiki", WikiHistory, base_name="wiki-history")

# Contact
from taiga6.projects.contact.api import ContactViewSet
router.register(r"contact", ContactViewSet, base_name="contact")


# Timelines
from taiga6.timeline.api import ProfileTimeline
from taiga6.timeline.api import UserTimeline
from taiga6.timeline.api import ProjectTimeline

router.register(r"timeline/profile", ProfileTimeline, base_name="profile-timeline")
router.register(r"timeline/user", UserTimeline, base_name="user-timeline")
router.register(r"timeline/project", ProjectTimeline, base_name="project-timeline")


# Webhooks
from taiga6.webhooks.api import WebhookViewSet
from taiga6.webhooks.api import WebhookLogViewSet

router.register(r"webhooks", WebhookViewSet, base_name="webhooks")
router.register(r"webhooklogs", WebhookLogViewSet, base_name="webhooklogs")


# GitHub webhooks
from taiga6.hooks.github.api import GitHubViewSet

router.register(r"github-hook", GitHubViewSet, base_name="github-hook")


# Gitlab webhooks
from taiga6.hooks.gitlab.api import GitLabViewSet

router.register(r"gitlab-hook", GitLabViewSet, base_name="gitlab-hook")


# Bitbucket webhooks
from taiga6.hooks.bitbucket.api import BitBucketViewSet

router.register(r"bitbucket-hook", BitBucketViewSet, base_name="bitbucket-hook")


# Gogs webhooks
from taiga6.hooks.gogs.api import GogsViewSet

router.register(r"gogs-hook", GogsViewSet, base_name="gogs-hook")


# Importer
from taiga6.export_import.api import ProjectImporterViewSet, ProjectExporterViewSet

router.register(r"importer", ProjectImporterViewSet, base_name="importer")
router.register(r"exporter", ProjectExporterViewSet, base_name="exporter")


# External apps
from taiga6.external_apps.api import Application, ApplicationToken

router.register(r"applications", Application, base_name="applications")
router.register(r"application-tokens", ApplicationToken, base_name="application-tokens")

# Third party importers
if settings.IMPORTERS.get('trello', {}).get('active', False):
    from taiga6.importers.trello.api import TrelloImporterViewSet
    router.register(r"importers/trello", TrelloImporterViewSet, base_name="importers-trello")

if settings.IMPORTERS.get('jira', {}).get('active', False):
    from taiga6.importers.jira.api import JiraImporterViewSet
    router.register(r"importers/jira", JiraImporterViewSet, base_name="importers-jira")

if settings.IMPORTERS.get('github', {}).get('active', False):
    from taiga6.importers.github.api import GithubImporterViewSet
    router.register(r"importers/github", GithubImporterViewSet, base_name="importers-github")

if settings.IMPORTERS.get('asana', {}).get('active', False):
    from taiga6.importers.asana.api import AsanaImporterViewSet
    router.register(r"importers/asana", AsanaImporterViewSet, base_name="importers-asana")


# Stats
#   - see taiga6.stats.routers and taiga6.stats.apps


# Feedback
#   - see taiga6.feedback.routers and taiga6.feedback.apps
