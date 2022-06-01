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
  keyframes,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Project } from '@taiga/data';

import { acceptInvitationSlug } from '~/app/shared/invite-to-project/data-access/+state/actions/invitation.action';
import { selectAcceptedInvite } from '../invite-to-project/data-access/+state/selectors/invitation.selectors';

type CardVariant = 'project' | 'placeholder' | 'invitation';
@UntilDestroy()
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
    trigger('itemSlideOutAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(5px)',
        }),
        animate(
          '600ms ease-out',
          keyframes([
            style({
              transform: 'translateY(5px)',
              offset: 0.5,
            }),
            style({
              opacity: 1,
              transform: 'translateY(0)',
              offset: 1,
            }),
          ])
        ),
      ]),
      transition(':leave', [
        style({
          transform: 'translateY(0)',
          opacity: 1,
          blockSize: '*',
          margin: '*',
          padding: '*',
        }),
        animate(
          '300ms ease-out',
          keyframes([
            style({
              opacity: 0,
              offset: 0.7,
            }),
            style({
              transform: 'translateY(-30px)',
              opacity: 0,
              blockSize: 0,
              margin: '0',
              padding: '0',
              offset: 1,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class ProjectCardComponent implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private store: Store,
    private cd: ChangeDetectorRef
  ) {}

  @Input()
  public variant: CardVariant = 'project';

  @Input()
  public workspaceSlug = '';

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
  public invitationStatus = '';
  public acceptedInvitation$ = this.store.select(selectAcceptedInvite);

  public ngAfterViewInit() {
    this.acceptedInvitation$
      .pipe(untilDestroyed(this))
      .subscribe((invitation) => {
        if (invitation === this.project.slug) {
          this.invitationStatus = 'accepted';
          this.cd.markForCheck();
        }
      });

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
    this.store.dispatch(
      acceptInvitationSlug({
        slug: this.project.slug,
      })
    );
  }

  public rejectInviteAnimationStart() {
    this.animationState = 'reject';
  }

  public rejectInviteAnimationEnd() {
    this.animationState = '';
    this.rejectInvite.next(this.project.slug);
  }
}
