/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  animate,
  AnimationEvent,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Project } from '@taiga/data';

type CardVariant = 'project' | 'placeholder' | 'invitation';

@Component({
  selector: 'tg-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideOut', [
      transition('* => reject', [
        group([
          query(
            '[data-animation="card-container"]',
            animate(
              '0.3s ease',
              style({
                transform: 'translateX(-120%)',
                inlineSize: '233px',
                opacity: 0,
              })
            )
          ),
          query(
            ':self',
            animate(
              '0.5s ease',
              style({
                inlineSize: 0,
              })
            )
          ),
        ]),
      ]),
    ]),
  ],
})
export class ProjectCardComponent implements AfterViewInit {
  constructor(private el: ElementRef) {}

  @Input()
  public variant: CardVariant = 'project';

  @Input()
  public slug = '';

  @Input()
  public firstProject = false;

  @Input()
  public project!: Pick<
    Project,
    'name' | 'slug' | 'description' | 'color' | 'logoSmall'
  >;

  @Output()
  public rejectInvite = new EventEmitter<Project['slug']>();

  @ViewChild('invitationCardContainer')
  public invitationCardContainer!: ElementRef;

  @HostBinding('@slideOut') public get slideOut() {
    return this.animationState;
  }

  @HostListener('@slideOut.done', ['$event']) public animationDone(
    event: AnimationEvent
  ) {
    if (event.toState === 'reject' && event.totalTime === 500) {
      this.rejectInviteAnimationEnd();
    }
  }

  public animationState = '';

  public ngAfterViewInit() {
    if (this.invitationCardContainer) {
      const invitationCardContainerInlineSize = (
        this.invitationCardContainer.nativeElement as HTMLElement
      ).offsetWidth;
      const invitationCardContainerBlockSize = (
        this.invitationCardContainer.nativeElement as HTMLElement
      ).offsetHeight;

      (
        this.el.nativeElement as HTMLElement
      ).style.inlineSize = `${invitationCardContainerInlineSize}px`;
      (
        this.el.nativeElement as HTMLElement
      ).style.blockSize = `${invitationCardContainerBlockSize}px`;
    }
  }

  public acceptInvite() {
    // Temporary trace
    console.log('accept invite');
  }

  public rejectInviteAnimationStart() {
    this.animationState = 'reject';
  }

  public rejectInviteAnimationEnd() {
    this.rejectInvite.next(this.project.slug);
  }
}
