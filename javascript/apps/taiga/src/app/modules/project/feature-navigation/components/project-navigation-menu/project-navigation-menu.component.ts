/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslocoDirective } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  TuiButtonModule,
  TuiHostedDropdownModule,
  TuiSvgModule,
} from '@taiga-ui/core';
import { Project, Workflow } from '@taiga/data';
import { AvatarComponent } from '@taiga/ui/avatar/avatar.component';
import { TooltipDirective } from '@taiga/ui/tooltip';
import { TooltipComponent } from '@taiga/ui/tooltip/tooltip.component';
import { HasPermissionDirective } from '~/app/shared/directives/has-permissions/has-permission.directive';
import { ProjectNavWorkflowMenuStylesDirective } from './project-navigation-menu-styles.directive';
import { ProjectNavWorkflowMenuPositionDirective } from './project-navigation-menu.directive';
import { selectCurrentWorkflowSlug } from '~/app/modules/project/feature-kanban/data-access/+state/selectors/kanban.selectors';
import { selectUrl } from '~/app/router-selectors';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filterNil } from '~/app/shared/utils/operators';
import { selectStory } from '~/app/modules/project/story-detail/data-access/+state/selectors/story-detail.selectors';

interface ProjectMenuDialog {
  hover: boolean;
  open: boolean;
  link: string;
  type: string;
  top: number;
  left: number;
  text: string;
  height: number;
  mainLinkHeight: number;
  children: {
    text: string;
    link: string;
  }[];
}
const cssValue = getComputedStyle(document.documentElement);

@UntilDestroy()
@Component({
  selector: 'tg-project-navigation-menu',
  standalone: true,
  templateUrl: './project-navigation-menu.component.html',
  styleUrls: ['./project-navigation-menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TuiSvgModule,
    RouterModule,
    HasPermissionDirective,
    AvatarComponent,
    TranslocoDirective,
    CommonModule,
    TooltipComponent,
    TooltipDirective,
    TuiButtonModule,
    TuiHostedDropdownModule,
    ProjectNavWorkflowMenuPositionDirective,
    ProjectNavWorkflowMenuStylesDirective,
  ],
  animations: [
    trigger('blockInitialRenderAnimation', [transition(':enter', [])]),
    trigger('slideIn', [
      transition(':enter', [
        style({
          background: `${cssValue.getPropertyValue('--color-gray90')}`,
          color: `${cssValue.getPropertyValue('--color-primary')}`,
        }),
        animate(
          '1000ms',
          style({
            background: 'none',
            color: `${cssValue.getPropertyValue('--color-gray40')}`,
          })
        ),
      ]),
    ]),
  ],
})
export class ProjectNavigationMenuComponent {
  @Input()
  public project!: Project;

  @Input()
  public collapsed!: boolean;

  @Output()
  public collapseMenu = new EventEmitter<void>();

  @Output()
  public displaySettingsMenu = new EventEmitter<void>();

  @ViewChild('backlogSubmenu', { static: false })
  public backlogSubmenuEl!: ElementRef;

  @ViewChild('backlogButton', { static: false })
  public backlogButtonElement!: ElementRef;

  @ViewChild('projectSettingButton', { static: false })
  public projectSettingButton!: ElementRef;

  public collapseText = true;
  public activeSection = false;
  public openworkflowsDropdown = false;
  public currentWorkflow = this.store.selectSignal(selectCurrentWorkflowSlug);
  public currentUrl = this.store.selectSignal(selectUrl);
  public storyIsOpen = this.store.selectSignal(selectStory);
  public isKanbanUrl = false;

  public dialog: ProjectMenuDialog = {
    open: false,
    hover: false,
    mainLinkHeight: 0,
    type: '',
    link: '',
    top: 0,
    left: 0,
    text: '',
    height: 0,
    children: [],
  };

  private dialogCloseTimeout?: ReturnType<typeof setTimeout>;
  private destroyRef = inject(DestroyRef);

  constructor(
    private cd: ChangeDetectorRef,
    private store: Store,
    private router: Router
  ) {
    this.store
      .select(selectCurrentWorkflowSlug)
      .pipe(takeUntilDestroyed(this.destroyRef), filterNil())
      .subscribe((workflowSlug) => {
        this.isKanbanUrl = this.currentUrl().includes(
          `/kanban/${workflowSlug}`
        );
      });

    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((evt) => evt instanceof NavigationEnd)
      )
      .subscribe((evt) => {
        this.isKanbanUrl = (evt as NavigationEnd).url.includes(
          `/kanban/${this.currentWorkflow()}`
        );
      });
  }

  public initDialog(
    el: HTMLElement,
    type: string,
    children: ProjectMenuDialog['children'] = []
  ) {
    if (this.dialogCloseTimeout) {
      clearTimeout(this.dialogCloseTimeout);
    }

    const text = el.getAttribute('data-text');

    if (text) {
      const navigationBarWidth = 48;

      if (el.querySelector('a')) {
        this.dialog.link = el.querySelector('a')!.getAttribute('href') ?? '';
      }
      this.dialog.hover = false;
      this.dialog.mainLinkHeight =
        type === 'project'
          ? (el.closest('.workspace') as HTMLElement).offsetHeight
          : el.offsetHeight;
      this.dialog.top =
        type === 'project'
          ? (el.closest('.workspace') as HTMLElement).offsetTop
          : el.offsetTop;
      this.dialog.open = true;
      this.dialog.text = text;
      this.dialog.children = children;
      this.dialog.type = type;
      this.dialog.left = navigationBarWidth;
    }
  }

  public popup(event: MouseEvent | FocusEvent, type: string) {
    if (!this.collapsed) {
      return;
    }

    this.dialog.type = type;
    this.initDialog(event.target as HTMLElement, type);
  }

  public enterDialog() {
    this.dialog.open = true;
    this.dialog.hover = true;
  }

  public out() {
    this.dialogCloseTimeout = setTimeout(() => {
      if (!this.dialog.hover) {
        this.dialog.open = false;
        this.dialog.type = '';
        this.cd.detectChanges();
      }
    }, 100);
  }

  public outDialog(focus?: string) {
    this.dialog.hover = false;
    if (focus === 'backlog') {
      (this.backlogButtonElement.nativeElement as HTMLElement).focus();
    }
    this.out();
  }

  public getCollapseIcon() {
    return this.collapsed ? 'collapse-right' : 'collapse-left';
  }

  public toggleCollapse() {
    this.collapseMenu.next();
  }

  public openSettings() {
    this.displaySettingsMenu.next();
    this.dialog.open = false;
    this.dialog.type = '';
  }

  public trackById(_index: number, workflow: Workflow) {
    return workflow.id;
  }
}
