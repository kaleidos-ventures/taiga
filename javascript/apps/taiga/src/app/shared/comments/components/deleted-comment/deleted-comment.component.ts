/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserComment } from '@taiga/data';
import { User } from '@taiga/data';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DateDistancePipe } from '~/app/shared/pipes/date-distance/date-distance.pipe';

@Component({
  selector: 'tg-deleted-comment',
  standalone: true,
  templateUrl: './deleted-comment.component.html',
  styleUrls: ['./deleted-comment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslocoModule, DateDistancePipe],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: 'comments',
    },
  ],
})
export class DeletedCommentComponent implements OnInit {
  @Input({ required: true }) public comment!: UserComment;
  @Input({ required: true }) public user!: User;

  public translocoService = inject(TranslocoService);

  public message!: string;

  public ngOnInit(): void {
    this.message = this.getDeletionMessage();
  }

  private getDeletionMessage(): string {
    const currentUser = this.user.username;
    const deletionUser = this.comment?.deletedBy?.username;
    const creationUser = this.comment?.createdBy.username;

    if (!deletionUser) {
      return this.translocoService.translate(
        'comments.deleted_message.default'
      );
    }

    if (currentUser === deletionUser) {
      if (currentUser === creationUser) {
        return this.translocoService.translate(
          'comments.deleted_message.own_comment'
        );
      } else {
        return this.translocoService.translate(
          'comments.deleted_message.other_comment',
          {
            fullName: this.comment.createdBy?.fullName,
          }
        );
      }
    }

    if (currentUser !== deletionUser) {
      if (currentUser === creationUser) {
        return this.translocoService.translate(
          'comments.deleted_message.own_comment_admin'
        );
      } else if (deletionUser === creationUser) {
        return this.translocoService.translate(
          'comments.deleted_message.other_comment_self'
        );
      } else {
        return this.translocoService.translate(
          'comments.deleted_message.other_comment_admin'
        );
      }
    }

    return this.translocoService.translate('comments.deleted_message.default');
  }
}
