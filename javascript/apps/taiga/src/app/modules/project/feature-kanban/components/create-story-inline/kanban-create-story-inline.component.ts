/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoService, TranslocoDirective } from '@ngneat/transloco';
import { Store } from '@ngrx/store';
import { Status, Workflow } from '@taiga/data';
import { v4 } from 'uuid';
import { KanbanActions } from '~/app/modules/project/feature-kanban/data-access/+state/actions/kanban.actions';
import {
  StoryTitleMaxLength,
  StoryTitleValidation,
} from '~/app/shared/story/title-validation';
import { TuiButtonModule } from '@taiga-ui/core';
import { CommonModule } from '@angular/common';
import { TuiActiveZoneModule } from '@taiga-ui/cdk';
import { InputsModule } from '@taiga/ui/inputs';

@Component({
  selector: 'tg-create-story-inline',
  templateUrl: './kanban-create-story-inline.component.html',
  styleUrls: ['./kanban-create-story-inline.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    InputsModule,
    TranslocoDirective,
    ReactiveFormsModule,
    TuiActiveZoneModule,
    TuiButtonModule,
  ],
})
export class KanbanCreateStoryInlineComponent implements AfterViewInit {
  @Input()
  public status!: Status;

  @Input()
  public workflow!: Workflow;

  @Input()
  public autoFocus = true;

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('title')
  public titleElement!: ElementRef;

  @HostListener('keydown.esc.prevent') public esc() {
    this.cancelSubmit();
  }

  public maxLength = StoryTitleMaxLength;

  public form = this.fb.nonNullable.group({
    title: ['', StoryTitleValidation],
  });

  public submitted = false;

  constructor(
    public fb: FormBuilder,
    private store: Store,
    private liveAnnouncer: LiveAnnouncer,
    private translocoService: TranslocoService
  ) {}

  public submit() {
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.store.dispatch(
        KanbanActions.createStory({
          story: {
            tmpId: v4(),
            title: this.form.get('title')!.value,
            description: '',
            status: {
              name: this.status.name,
              id: this.status.id,
              color: this.status.color,
            },
            assignees: [],
          },
          workflow: this.workflow.slug,
        })
      );
      const announcement = this.translocoService.translate(
        'kanban.story_created',
        {
          title: this.form.get('title')!.value,
        }
      );

      this.liveAnnouncer.announce(announcement, 'assertive').then(
        () => {
          setTimeout(() => {
            this.reset();
            (this.titleElement.nativeElement as HTMLElement).focus();
            this.liveAnnouncer.clear();
          }, 50);
        },
        () => {
          // error
        }
      );
    } else {
      this.submitted = true;
    }
  }

  public cancelSubmit() {
    this.cancel.emit();
    this.reset();
  }

  public leaveForm(active: boolean) {
    if (!active) {
      this.submit();
      this.cancelSubmit();
    }
  }

  public ngAfterViewInit(): void {
    if (this.autoFocus) {
      (this.titleElement.nativeElement as HTMLElement).focus();
    }
  }

  private reset() {
    this.form.reset();
    this.submitted = false;
  }
}
