/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { FocusMonitor } from '@angular/cdk/a11y';
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShortcutsService } from '@taiga/core';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  filter,
  finalize,
  map,
  of,
  switchMap,
  takeUntil,
  timer,
} from 'rxjs';
import {
  calculateTooltipPositionByPreference,
  positionMapping,
} from './calculate-tooltip-position';
import { TooltipPosition } from './tooltip-position.model';
import { TooltipComponent } from './tooltip.component';
import { AccesibleTooltipService } from './tooltip.service';

let nextId = 0;

@Directive({
  selector: '[tgUiTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit, OnDestroy, AfterViewInit {
  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private elementRef = inject(ElementRef) as ElementRef<HTMLElement>;
  private shortcutsService = inject(ShortcutsService);
  private destroyRef = inject(DestroyRef);
  private focusMonitor = inject(FocusMonitor);
  private ngZone = inject(NgZone);
  private accesibleTooltipService = inject(AccesibleTooltipService);

  @Input({
    required: true,
    alias: 'tgUiTooltip',
  })
  public set content(
    content: TemplateRef<unknown> | string | null | undefined
  ) {
    if (content === null || content === undefined) {
      this.contentString = undefined;
      this.contentTemplateRef = undefined;

      return;
    }

    if (typeof content === 'string') {
      this.contentString = content;
    } else {
      this.contentTemplateRef = content;
    }
  }

  @Input()
  public set tgManual(value: boolean) {
    this.manualControl = true;

    if (value) {
      this.showWithDelay();
    } else {
      this.hideWithDeleay();
    }
  }

  @Input()
  public set tgUiTooltipDisabled(disabled: boolean) {
    this.disabled$.next(disabled);
  }

  @Input()
  public tgUiTooltipOffsetX = 0;

  @Input()
  public tgUiTooltipOffsetY = 8;

  @Input()
  public tgUiTooltipPosition: TooltipPosition = 'bottom-left';

  @Input()
  public set tgUiTooltipCreateAccesibleTooltip(value: boolean) {
    this.createAccesibleTooltip$.next(value);
  }

  @Input()
  public tgUiTooltipStaysOpenOnHover = true;

  @Input()
  public tgUiTooltipDelayOpen = 300;

  @Input()
  public tgUiTooltipDelayClose = 0;

  public id = `tg-ui-tooltip-${nextId++}`;

  @HostListener('mouseenter')
  public mouseEnter() {
    if (this.manualControl) {
      return;
    }

    this.showWithDelay();
  }

  @HostListener('mouseleave', ['$event'])
  public mouseLeave(e: MouseEvent) {
    if (this.manualControl) {
      return;
    }

    if (!this.isRelated(e.relatedTarget as HTMLElement)) {
      this.hideWithDeleay();
    }
  }

  @HostListener('mousedown')
  public mouseDown() {
    if (this.manualControl) {
      return;
    }

    this.tooltipVisibility$.next({ show: false });
  }

  private overlayRef?: OverlayRef;
  private contentString?: string;
  private contentTemplateRef?: TemplateRef<unknown>;
  private tooltipVisibility$ = new Subject<{
    delay?: number;
    show: boolean;
  }>();

  private createAccesibleTooltip$ = new BehaviorSubject<boolean>(true);
  private disabled$ = new BehaviorSubject<boolean>(false);
  private finalPosition: TooltipPosition = this.tgUiTooltipPosition;
  private tooltipRef?: ComponentRef<TooltipComponent>;
  private manualControl = false;

  public ngOnInit() {
    combineLatest([this.createAccesibleTooltip$, this.disabled$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([create]) => {
        if (create && this.showTooltip()) {
          this.createAccesibleTooltipComponent();
        } else {
          this.destroyAccesibleTooltip();
        }
      });

    this.tooltipVisibility$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.showTooltip()),
        switchMap((options) => {
          return options?.delay
            ? timer(options.delay).pipe(map(() => options))
            : of(options);
        })
      )
      .subscribe(({ show }) => {
        if (show) {
          this.show();
        } else {
          this.hide();
        }
      });
  }

  public ngAfterViewInit() {
    this.showTooltipOnFocus();
  }

  public ngOnDestroy() {
    this.tooltipVisibility$.next({ show: false });
    this.destroyAccesibleTooltip();
  }

  private hide() {
    this.destroyOverlay();
  }

  private initOverlay() {
    if (this.overlayRef) {
      return;
    }

    const positions = calculateTooltipPositionByPreference(
      this.tgUiTooltipPosition
    );
    let offsetY = this.tgUiTooltipOffsetY;

    if (positions[0].originY === 'top') {
      offsetY = -offsetY;
    }

    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withDefaultOffsetY(offsetY)
      .withDefaultOffsetX(this.tgUiTooltipOffsetX);
    this.overlayRef = this.overlay.create({ positionStrategy });

    positionStrategy.positionChanges.subscribe((change) => {
      const finalPosition = positionMapping.find((position) => {
        return (
          position.config.originX === change.connectionPair.originX &&
          position.config.originY === change.connectionPair.originY &&
          position.config.overlayX === change.connectionPair.overlayX &&
          position.config.overlayY === change.connectionPair.overlayY
        );
      });

      if (finalPosition) {
        this.finalPosition = finalPosition.key;
        this.ngZone.run(() => {
          if (this.tooltipRef?.instance) {
            this.tooltipRef.instance.position = this.finalPosition;
          }
        });
      }
    });
  }

  private showTooltipOnFocus() {
    this.focusMonitor
      .monitor(this.elementRef)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((origin) => {
        if (!origin) {
          this.ngZone.run(() => {
            this.tooltipVisibility$.next({ show: false });
          });
        } else if (origin === 'keyboard') {
          this.ngZone.run(() => this.showWithDelay());
        }
      });
  }

  private destroyOverlay() {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef?.detach();
    }
  }

  private createTooltipComponent() {
    if (!this.overlayRef || this.overlayRef.hasAttached()) {
      return;
    }

    const tooltipPortal = new ComponentPortal(TooltipComponent);
    const tooltipRef = this.overlayRef.attach(tooltipPortal);

    if (this.contentString) {
      tooltipRef.instance.text = this.contentString;
    } else if (this.contentTemplateRef) {
      tooltipRef.instance.template = this.contentTemplateRef;
    }

    tooltipRef.instance.position = this.finalPosition;
    tooltipRef.instance.staysOpenOnHover = this.tgUiTooltipStaysOpenOnHover;

    tooltipRef.instance.leaveTooltip
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const relatedTarget = event.relatedTarget as HTMLElement;

        if (!this.isRelated(relatedTarget)) {
          this.hideWithDeleay();
        }
      });

    return tooltipRef;
  }

  private isRelated(el: HTMLElement) {
    return (
      el === this.elementRef.nativeElement ||
      this.elementRef.nativeElement.contains(el) ||
      this.overlayRef?.overlayElement.contains(el)
    );
  }

  private showTooltip() {
    return (
      !this.disabled$.value && !!(this.contentString || this.contentTemplateRef)
    );
  }

  private show() {
    this.initOverlay();
    this.tooltipRef = this.createTooltipComponent();
    this.closeTooltipOnESC();
  }

  private showWithDelay() {
    this.tooltipVisibility$.next({
      show: true,
      delay: this.tgUiTooltipDelayOpen,
    });
  }

  private hideWithDeleay() {
    this.tooltipVisibility$.next({
      show: false,
      delay: this.tgUiTooltipDelayClose,
    });
  }

  private createAccesibleTooltipComponent() {
    const content = this.contentString ?? this.contentTemplateRef;

    if (content) {
      const accesibleTooltipId =
        this.accesibleTooltipService.createAccesibleTooltipComponent(
          this,
          content
        );

      this.elementRef.nativeElement.setAttribute(
        'aria-describedby',
        accesibleTooltipId
      );
    }
  }

  private destroyAccesibleTooltip() {
    this.accesibleTooltipService.directiveDestroyed(this);
    this.elementRef.nativeElement.removeAttribute('aria-describedby');
  }

  private closeTooltipOnESC() {
    this.shortcutsService.setScope('tooltip');

    this.shortcutsService
      .task('cancel', {}, 'tooltip')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        takeUntil(this.tooltipVisibility$.pipe(filter(({ show }) => !show))),
        finalize(() => {
          this.shortcutsService.deleteScope('tooltip');
        })
      )
      .subscribe(() => {
        this.tooltipVisibility$.next({ show: false });
      });
  }
}
