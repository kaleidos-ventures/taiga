/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { NumberedPaginationComponent } from './numbered-pagination.component';
import { getTranslocoModule } from '../transloco/transloco-testing.module';

describe('TooltipDirective', () => {
  let spectator: Spectator<NumberedPaginationComponent>;
  const createComponent = createComponentFactory({
    component: NumberedPaginationComponent,
    imports: [getTranslocoModule()],
  });

  it('disable next / previous buttons', () => {
    spectator = createComponent({
      props: {
        currentPage: 0,
        totalPages: 3,
      },
    });

    const nextButton = spectator.query('[data-test="next-page-button"]');
    const previousButton = spectator.query(
      '[data-test="previous-page-button"]'
    );

    expect(nextButton).not.toHaveAttribute('disabled');
    expect(previousButton).toHaveAttribute('disabled');

    spectator.setInput({
      currentPage: 1,
    });

    spectator.detectChanges();

    expect(nextButton).not.toHaveAttribute('disabled');
    expect(previousButton).not.toHaveAttribute('disabled');

    spectator.setInput({
      currentPage: 2,
    });

    spectator.detectChanges();

    expect(nextButton).toHaveAttribute('disabled');
    expect(previousButton).not.toHaveAttribute('disabled');
  });

  it('page generation', () => {
    spectator = createComponent({
      props: {
        currentPage: 0,
        totalPages: 20,
      },
    });

    let pageButtons = spectator
      .queryAll<HTMLButtonElement | HTMLElement>(
        '[data-test="page-button"],[data-test="more-pages"]'
      )
      .map((it) => {
        return it.innerHTML.trim();
      });

    expect(pageButtons).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '...',
      '20',
    ]);

    spectator.setInput({
      currentPage: 10,
    });

    spectator.detectChanges();

    pageButtons = spectator
      .queryAll<HTMLElement>(
        '[data-test="page-button"],[data-test="more-pages"]'
      )
      .map((it) => {
        return it.innerHTML.trim();
      });

    expect(pageButtons).toEqual([
      '1',
      '...',
      '9',
      '10',
      '11',
      '12',
      '13',
      '...',
      '20',
    ]);
  });
});
