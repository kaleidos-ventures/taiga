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
  selector: 'tg-ui-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: [
    '../inputs.css',
    './image-upload.component.css'
  ],
  providers: [{
    provide: TRANSLOCO_SCOPE,
    useValue: {
      scope: 'image_upload',
      alias: 'image_upload',
    },
  },]
})
export class ImageUploadComponent implements OnChanges {
  @Input() public label = '';
  @Input() public tip = '';
  @Input() public title = '';
  @Input() public color = 0;
  @Input() public accept?: string;
  @Input() public control!: FormControl;

  @ViewChild('imageUpload')
  public imageUpload!: ElementRef<HTMLInputElement>;

  @Output()
  public imageSelected = new EventEmitter<File | undefined>();

  public safeImageUrl = '';

  constructor(
    private cd: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.control) {
      if (this.control.value) {
        this.safeImageUrl = this.domSanitizer.bypassSecurityTrustUrl(this.control.value) as string;
      }

      this.control.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe((value: string) => {
          this.safeImageUrl = this.domSanitizer.bypassSecurityTrustUrl(value) as string;
        });
    }
  }

  public displayImageUploader() {
    this.imageUpload.nativeElement.click();
  }

  public onImageSelected(event: Event): void  {
    const target = (event.target as HTMLInputElement);
    if (target && target.files?.length) {
      const img: File = target.files[0];
      this.imageSelected.next(img);

      // Read the contents of the file;
      const reader = new FileReader();
      reader.readAsDataURL(img);
      reader.onload = () => {
        const url = reader.result as string;

        if (img.type === 'image/gif') {
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
    this.imageSelected.next();
    this.imageUpload.nativeElement.value = '';
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
