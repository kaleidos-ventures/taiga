/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

@Component({
  selector: 'tg-ui-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: [
    '../inputs.css',
    './file-upload.component.css'
  ],
  providers: [{
    provide: TRANSLOCO_SCOPE,
    useValue: {
      scope: 'file_upload',
      alias: 'file_upload',
    },
  },]
})
export class FileUploadComponent {

  public filePath = '';

  @Input() public label = '';
  @Input() public tip = '';
  @Input() public title = '';
  @Input() public color = 0;
  @Input() public accept?: string;

  @ViewChild('iconUpload')
  public iconUpload!: ElementRef<HTMLInputElement>;

  @Output()
  public projectImage = new EventEmitter<File | undefined>();

  constructor(
    private cd: ChangeDetectorRef,
  ) {}

  public displayImageUploader() {
    this.iconUpload.nativeElement.click();
  }

  public onFileSelected(event: Event): void  {
    const target = (event.target as HTMLInputElement);
    if (target && target.files?.length) {
      const file: File = target.files[0];
      this.projectImage.next(file);

      // Read the contents of the file;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.filePath = reader.result as string;
      };

      this.cd.markForCheck();
    }
  }

  public removeImage() {
    this.projectImage.next();
    this.filePath = '';
  }

}
