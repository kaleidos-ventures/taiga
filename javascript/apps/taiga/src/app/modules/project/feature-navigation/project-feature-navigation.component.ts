/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  animate,
  AnimationEvent,
  group,
  query,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { Subject } from 'rxjs';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { ProjectNavigationSettingsComponent } from './components/project-navigation-settings/project-navigation-settings.component';
import { CommonModule } from '@angular/common';
import { ProjectNavigationMenuComponent } from './components/project-navigation-menu/project-navigation-menu.component';

const collapseMenuAnimation = '200ms ease-out';
const openMenuAnimation = '200ms ease-in';
const menuWidth = '200px';
const collapseMenuWidth = '48px';
const settingsMenuAnimation = '300ms ease-in-out';
const translateMenuSelector = '.main-nav-container-inner';

@Component({
  selector: 'tg-project-navigation',
  templateUrl: './project-feature-navigation.component.html',
  styleUrls: ['./project-feature-navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState],
  animations: [
    trigger('openCollapse', [
      state(
        'collapsed',
        style({
          inlineSize: collapseMenuWidth,
        })
      ),
      state(
        'open, open-settings',
        style({
          inlineSize: menuWidth,
        })
      ),
      transition('open => collapsed', [
        query('[data-animation="text"]', style({ opacity: 1 })),
        query('[data-animation="text"]', animate(100, style({ opacity: 0 }))),
        animate(collapseMenuAnimation),
      ]),
      transition('collapsed => open', [
        query(':self', animate(openMenuAnimation)),
      ]),
      transition('open <=> open-settings', [
        query(translateMenuSelector, [
          animate(
            settingsMenuAnimation,
            style({
              transform: 'translateX({{ horizontalTranslate }})',
            })
          ),
        ]),
      ]),
      transition('collapsed => open-settings', [
        group([
          animate(settingsMenuAnimation, style({ inlineSize: menuWidth })),
          query(translateMenuSelector, [
            animate(
              settingsMenuAnimation,
              style({
                transform: 'translateX({{ horizontalTranslate }})',
              })
            ),
          ]),
        ]),
      ]),
      transition('open-settings => collapsed', [
        group([
          query(translateMenuSelector, [
            style({
              transform: `translateX(-${collapseMenuWidth})`,
            }),
          ]),
          animate(
            settingsMenuAnimation,
            style({ inlineSize: collapseMenuWidth })
          ),
          query(translateMenuSelector, [
            animate(
              settingsMenuAnimation,
              style({
                transform: 'translateX({{ horizontalTranslate }})',
              })
            ),
          ]),
        ]),
      ]),
    ]),
    trigger('mainNavContainer', [
      state(
        'open',
        style({
          transform: 'translateX(0)',
        })
      ),
      state(
        'closed',
        style({
          transform: 'translateX(0)',
        })
      ),
      state(
        'open-settings',
        style({
          transform: 'translateX({{ horizontalTranslate }})',
        }),
        {
          params: {
            horizontalTranslate: '0%',
          },
        }
      ),
    ]),
  ],
  standalone: true,
  imports: [
    CommonModule,
    ProjectNavigationMenuComponent,
    ProjectNavigationSettingsComponent,
  ],
})
export class ProjectNavigationComponent implements OnInit, AfterViewInit {
  @Input()
  public project!: Project;

  @HostBinding('class.collapsed')
  public collapsed = false;

  @HostBinding('@openCollapse') public get menuState() {
    let value: string;
    let horizontalTranslate = '0%';

    if (this.showProjectSettings) {
      value = 'open-settings';
      horizontalTranslate = this.collapsed ? `-${collapseMenuWidth}` : '-50%';
    } else {
      value = this.collapsed ? 'collapsed' : 'open';
    }

    return {
      value,
      params: {
        horizontalTranslate,
      },
    };
  }

  @HostListener('@openCollapse.start', ['$event'])
  public captureStartEvent($event: AnimationEvent) {
    this.animationEvents$.next($event);
    this.settingsAnimationInProgress = true;
  }

  @HostListener('@openCollapse.done', ['$event'])
  public captureDoneEvent($event: AnimationEvent) {
    this.animationEvents$.next($event);

    this.settingsAnimationInProgress = false;
  }

  @HostListener('window:scroll', [])
  public onWindowScroll() {
    this.updateBlockSize(
      `calc(100vh - ${
        (this.el.nativeElement as HTMLElement).getBoundingClientRect().top
      }px)`
    );
  }

  public showProjectSettings = false;
  public settingsAnimationInProgress = false;
  public animationEvents$ = new Subject<AnimationEvent>();

  constructor(
    private el: ElementRef,
    private localStorage: LocalStorageService,
    private router: Router
  ) {}

  public ngOnInit() {
    this.collapsed = !!LocalStorageService.get('projectnav-collapsed');
    this.router.events.subscribe(() => {
      !this.router.url.includes('/settings')
        ? (this.showProjectSettings = false)
        : (this.showProjectSettings = true);
    });
    this.showProjectSettings = this.router.isActive(
      this.router.createUrlTree(['project', this.project.id, 'settings']),
      {
        paths: 'subset',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }
    );
  }

  public ngAfterViewInit() {
    const size = this.calcBlockSize();
    this.updateBlockSize(size);
  }

  public calcBlockSize() {
    const el = this.el.nativeElement as HTMLElement;
    const header = getComputedStyle(el).getPropertyValue('--header-height');
    const banner = getComputedStyle(el).getPropertyValue('--banner-height');
    return `calc(100vh - ${header.length ? header : '0px'} - ${
      banner.length ? banner : '0px'
    })`;
  }

  public updateBlockSize(value: string) {
    (this.el.nativeElement as HTMLElement).style.blockSize = value;
  }

  public toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.localStorage.set('projectnav-collapsed', this.collapsed);
  }

  public openSettings() {
    this.showProjectSettings = true;
    void this.router.navigate([
      'project',
      this.project.id,
      this.project.slug,
      'settings',
      'members',
    ]);
  }

  public closeMenu() {
    this.showProjectSettings = false;
  }
}
