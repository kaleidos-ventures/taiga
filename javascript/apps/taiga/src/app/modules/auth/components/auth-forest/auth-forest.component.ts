/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'tg-auth-forest',
  standalone: true,
  templateUrl: './auth-forest.component.html',
  styleUrls: ['./auth-forest.component.css'],
  imports: [CommonModule, NgOptimizedImage],
})
export class AuthForestComponent {}
