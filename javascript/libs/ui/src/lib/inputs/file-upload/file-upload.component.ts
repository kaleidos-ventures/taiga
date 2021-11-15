/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormControl } from '@ngneat/reactive-forms';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
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
export class FileUploadComponent implements OnChanges {
  @Input() public label = '';
  @Input() public tip = '';
  @Input() public title = '';
  @Input() public color = 0;
  @Input() public accept?: string;
  @Input() public control!: FormControl;

  @ViewChild('iconUpload')
  public iconUpload!: ElementRef<HTMLInputElement>;

  @Output()
  public fileSelected = new EventEmitter<File | undefined>();

  public filePath = '';

  constructor(
    private cd: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.control) {
      this.control.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value: string) => {
          this.filePath = this.domSanitizer.bypassSecurityTrustUrl(value) as string;
        });
    }
  }

  public displayImageUploader() {
    this.iconUpload.nativeElement.click();
  }

  public onFileSelected(event: Event): void  {
    const target = (event.target as HTMLInputElement);
    if (target && target.files?.length) {
      const file: File = target.files[0];
      this.fileSelected.next(file);

      // Read the contents of the file;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const url = reader.result as string;

        if (file.type === 'image/gif') {
          void this.getGifFrame(url).then((staticUrl) => {
            this.control.setValue(staticUrl);
          });
        } else {
          this.control.setValue(url);
        }

      };

      this.cd.markForCheck();
    }
  }

  public removeImage() {
    this.fileSelected.next();
    this.control.setValue('');
  }

  public getGifFrame(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image;
      img.onload = () => {
        if (ctx) {
          const { width, height } = img;
          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0);

          resolve(canvas.toDataURL());
        } else {
          reject('error transforming gif to static image');
        }
      };

      img.src = url;
    });
  }
}
