/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectorRef,
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Project } from '@taiga/data';
import { Subscription } from 'rxjs';
import { selectCurrentProject } from '~/app/modules/project/data-access/+state/selectors/project.selectors';

// How to use

// Append this directive to any HTML with conditions:
// Permission to test (view, edit, etc.)
// Entity to apply the permission (issue, task, etc.)
// Operation you want to perform between the permissions query (AND | OR)

// Example
// <div *hasPermission="['comment']; entity: 'issue'; operation: 'OR'"> Visible </div>

// If the conditions are met, the content will be visible, otherwise this node will be removed from the HTML.

export type Operation = 'AND' | 'OR';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[hasPermission]' })
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input()
  public set hasPermission(permissions: string[]) {
    this.permissions = permissions;
  }

  @Input()
  public set hasPermissionEntity(entity: string) {
    this.entity = entity;
  }

  @Input()
  public set hasPermissionOperation(operation: Operation) {
    this.operation = operation;
  }

  public project!: Project;
  public subscription!: Subscription;
  public project$ = this.store.select(selectCurrentProject);
  private hasView = false;
  private permissions: string[] = [];
  private operation = 'AND';
  private entity!: string;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private cd: ChangeDetectorRef,
    private store: Store
  ) {}

  public ngOnInit() {
    this.subscription = this.project$.subscribe((project) => {
      this.project = project;
      this.updateView();
    });
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateView() {
    if (this.checkPermission() && !this.hasView) {
      this.hasView = true;
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.cd.markForCheck();
    } else {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private includesPermission(permission: string) {
    if (this.project.myPermissions.length) {
      return this.project.myPermissions.find(
        (projectPermission: string) =>
          projectPermission.toUpperCase() === permission.toUpperCase()
      );
    }
    return false;
  }

  private checkPermission() {
    if (this.project?.myPermissions) {
      console.log(this.project);
      if (this.operation === 'OR') {
        console.log('OR');
        return this.permissions.some((permission) =>
          this.includesPermission(`${permission}_${this.entity}`)
        );
      } else if (this.operation === 'AND') {
        console.log('AND');
        return this.permissions.every((permission) =>
          this.includesPermission(`${permission}_${this.entity}`)
        );
      }
    }
    return true;
  }
}
