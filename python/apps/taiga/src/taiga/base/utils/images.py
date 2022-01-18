# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from typing import Union

from asgiref.sync import sync_to_async
from easy_thumbnails.exceptions import InvalidImageFormatError  # type: ignore
from easy_thumbnails.files import ThumbnailerFieldFile, get_thumbnailer  # type: ignore
from easy_thumbnails.source_generators import pil_image  # type: ignore
from fastapi import UploadFile
from taiga.conf import settings


def get_thumbnail(relative_image_path: str, thumbnailer_size: str) -> ThumbnailerFieldFile:
    try:
        thumbnailer = get_thumbnailer(relative_image_path)
        return thumbnailer[thumbnailer_size]

    except InvalidImageFormatError:
        return None


@sync_to_async
def get_thumbnail_url(relative_image_path: str, thumbnailer_size: str) -> Union[str, None]:
    thumbnail = get_thumbnail(relative_image_path, thumbnailer_size)

    if not thumbnail:
        return None

    return thumbnail.url


def valid_content_type(uploaded_img: UploadFile) -> bool:
    return uploaded_img.content_type in settings.IMAGES.VALID_IMAGE_FORMATS


def valid_image_format(uploaded_img: UploadFile) -> bool:
    try:
        pil_image(uploaded_img.file)
        return True
    except Exception:
        return False
