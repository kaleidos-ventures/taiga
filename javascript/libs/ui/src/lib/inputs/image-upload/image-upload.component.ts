/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlContainer,
  FormControl,
  FormGroupDirective,
} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FieldService } from '../services/field.service';
import { ErrorComponent } from '../error/error.component';
import { CommonModule } from '@angular/common';
import { TuiButtonModule } from '@taiga-ui/core';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';

let nextId = 0;

@UntilDestroy()
@Component({
  selector: 'tg-ui-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['../inputs.css', './image-upload.component.css'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'image_upload',
        alias: 'image_upload',
      },
    },
    FieldService,
  ],
  standalone: true,
  imports: [
    TranslocoDirective,
    AvatarComponent,
    TuiButtonModule,
    CommonModule,
    ErrorComponent,
  ],
})
export class ImageUploadComponent implements OnChanges {
  @Input() public label = '';
  @Input() public tip = '';
  @Input() public title = '';
  @Input() public color = 0;
  @Input() public accept?: string;
  @Input() public control!: FormControl<File | null | string>;
  @Input() public id = `upload-${nextId++}`;
  @Input() public formatError = 'Invalid format';
  @Input() public initialImage = '';

  @ViewChild('imageUpload')
  public imageUpload!: ElementRef<HTMLInputElement>;

  @Output()
  public imageSelected = new EventEmitter<File | undefined>();

  public safeImageUrl = '';

  constructor(
    private cd: ChangeDetectorRef,
    private domSanitizer: DomSanitizer,
    private fieldService: FieldService,
    private controlContainer: ControlContainer
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.control) {
      this.fieldService.control = this.control;
      this.fieldService.form = this.form;
      this.fieldService.id = this.id;

      if (this.controlValue instanceof File && this.control.valid) {
        const path = URL.createObjectURL(this.controlValue);
        this.safeImageUrl = this.getSafeUrl(path);
      } else {
        this.safeImageUrl = this.initialImage;
      }

      this.control.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        if (this.controlValue instanceof File && this.control.valid) {
          if (this.controlValue.type === 'image/gif') {
            const path = URL.createObjectURL(this.controlValue);

            void this.getGifFrame(path).then((staticUrl) => {
              this.safeImageUrl = this.getSafeUrl(staticUrl);
            });
          } else {
            const path = URL.createObjectURL(this.controlValue);
            this.safeImageUrl = this.getSafeUrl(path);
          }
        } else {
          this.safeImageUrl = '';
        }
      });
    }
  }

  public get form() {
    return this.controlContainer.formDirective as FormGroupDirective;
  }

  public get controlValue() {
    return this.control.value;
  }

  public hasImage() {
    if (this.control.value || this.control.dirty) {
      return !!this.control.value;
    }

    return !!this.initialImage;
  }

  public getSafeUrl(path: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(path) as string;
  }

  public displayImageUploader() {
    this.imageUpload.nativeElement.click();
  }

  public onImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.files?.length) {
      const img: File = target.files[0];
      this.imageSelected.emit(img);

      const reader = new FileReader();
      reader.readAsDataURL(img);
      reader.onload = () => {
        if (!this.isValid(img.type)) {
          this.removeImage();
          this.control.setErrors({ type: true });
          this.control.markAllAsTouched();
        } else {
          this.control.setValue(img);
        }

        this.cd.markForCheck();
      };
    }
  }

  public isValid(type: string) {
    if (this.accept) {
      const accept = this.accept.split(',').map((ext) => ext.trim());

      return accept.some((ext) => {
        return new RegExp(ext).test(type);
      });
    }

    return true;
  }

  public removeImage() {
    this.imageSelected.emit();
    this.imageUpload.nativeElement.value = '';
    this.control.setValue('');
    this.control.markAsDirty();
  }

  public getGifFrame(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
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
