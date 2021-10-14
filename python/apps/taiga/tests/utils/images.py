# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from io import BytesIO, StringIO

from django.core.files import File
from fastapi import UploadFile
from PIL import Image


def create_valid_testing_image():
    file = BytesIO()
    pil_image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    pil_image.save(file, format="png")
    file.name = "test.png"
    file.seek(0)
    return file


def create_testing_image_bmp():
    file = BytesIO()
    pil_image = Image.new("RGBA", size=(50, 50), color=(155, 0, 0))
    pil_image.save(file, format="tif")
    file.name = "test.tif"
    file.seek(0)

    return file


def create_testing_image_txt():
    file = StringIO("some initial text data")
    file.name = "test.txt"
    file.seek(0)
    return file


png_image_file = create_valid_testing_image()
text_file = create_testing_image_txt()

valid_image_f = File(file=png_image_file, name=png_image_file.name)

valid_image_upload_file = UploadFile(file=png_image_file, filename=png_image_file.name, content_type="image/png")
invalid_image_upload_file = UploadFile(file=text_file, filename=png_image_file.name, content_type="image/png")
text_upload_file = UploadFile(file=text_file, filename=text_file.name, content_type="text/plain")
