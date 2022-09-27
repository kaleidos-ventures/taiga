/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { take } from 'rxjs';
import { DragService } from './drag.service';

interface FakeRect {
  x?: number;
  y?: number;
  right?: number;
  left?: number;
  top?: number;
  bottom?: number;
  width?: number;
  height?: number;
}

const createFakeDropZone = (
  id: number,
  rect: FakeRect,
  candidates: any[] = []
): any => {
  return {
    id,
    getCandidates: () => {
      return candidates;
    },
    nativeElement: {
      getBoundingClientRect: () => {
        return {
          x: 0,
          y: 0,
          right: 0,
          left: 0,
          top: 0,
          bottom: 0,
          width: 0,
          height: 0,
          ...rect,
        };
      },
    },
  };
};

const createFakeDraggableDirective: any = (
  id: number,
  disabled: boolean,
  rect: FakeRect
) => {
  return {
    id,
    dragDisabled: disabled,
    dragData: { id },
    nativeElement: {
      getBoundingClientRect: () => {
        return {
          x: 0,
          y: 0,
          right: 0,
          left: 0,
          top: 0,
          bottom: 0,
          width: 0,
          height: 0,
          ...rect,
        };
      },
    },
  };
};

const createRectByIndex = (
  index: number,
  left = 0,
  width = 300,
  height = 150
) => {
  return {
    right: left + width,
    bottom: index * height + height,
    x: left,
    top: index * height,
    y: index * height,
  };
};

describe('DragService', () => {
  let spectator: SpectatorService<DragService>;

  const createService = createServiceFactory({
    service: DragService,
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('drag after second draggable item', (done) => {
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
      createFakeDraggableDirective(2, false, createRectByIndex(1)),
      createFakeDraggableDirective(3, false, createRectByIndex(2)),
      createFakeDraggableDirective(4, false, createRectByIndex(3)),
    ];

    spectator.service.addDropZone(
      createFakeDropZone(
        1,
        {
          x: 0,
          right: 500,
          y: 0,
          bottom: 1000,
        },
        candidates
      )
    );

    spectator.service.newDragPosition({
      x: 10,
      y: 160,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(spectator.service.dropZoneValue()?.id).toEqual(1);

        expect(over).toEqual({
          dropZone: 1,
          over: { position: 'bottom', result: { id: 2 } },
          source: [], // filled dragStart
        });
        done();
      });
  });

  it('drag before third draggable item', (done) => {
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
      createFakeDraggableDirective(2, false, createRectByIndex(1)),
      createFakeDraggableDirective(3, false, createRectByIndex(2)),
      createFakeDraggableDirective(4, false, createRectByIndex(3)),
    ];

    spectator.service.addDropZone(
      createFakeDropZone(
        1,
        {
          x: 0,
          right: 500,
          y: 0,
          bottom: 1000,
        },
        candidates
      )
    );

    spectator.service.newDragPosition({
      x: 10,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(spectator.service.dropZoneValue()?.id).toEqual(1);

        expect(over).toEqual({
          dropZone: 1,
          over: { position: 'top', result: { id: 3 } },
          source: [], // filled dragStart
        });
        done();
      });
  });

  it('ignore current as a valid drop candidate', (done) => {
    // same test as the previous one but with the result candidate as a source
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
      createFakeDraggableDirective(2, false, createRectByIndex(1)),
      createFakeDraggableDirective(3, false, createRectByIndex(2)),
      createFakeDraggableDirective(4, false, createRectByIndex(3)),
    ];

    spectator.service.addDropZone(
      createFakeDropZone(
        1,
        {
          x: 0,
          right: 500,
          y: 0,
          bottom: 1000,
        },
        candidates
      )
    );

    spectator.service['source'] = [{ id: 3, data: {} } as any];

    spectator.service.newDragPosition({
      x: 10,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(over).toBeUndefined();
        done();
      });
  });

  it('no matching candidate', (done) => {
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
      createFakeDraggableDirective(2, false, createRectByIndex(1)),
      createFakeDraggableDirective(3, false, createRectByIndex(2)),
      createFakeDraggableDirective(4, false, createRectByIndex(3)),
    ];

    spectator.service.addDropZone(
      createFakeDropZone(
        1,
        {
          x: 0,
          right: 500,
          y: 0,
          bottom: 1000,
        },
        candidates
      )
    );

    spectator.service.newDragPosition({
      x: 1000,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(over).toBeUndefined();
        done();
      });
  });

  it('empty drop zone', (done) => {
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
      createFakeDraggableDirective(2, false, createRectByIndex(1)),
      createFakeDraggableDirective(3, false, createRectByIndex(2)),
      createFakeDraggableDirective(4, false, createRectByIndex(3)),
    ];

    spectator.service.addDropZone(
      createFakeDropZone(
        1,
        {
          x: 0,
          right: 500,
          y: 0,
          bottom: 1000,
        },
        candidates
      )
    );

    spectator.service.addDropZone(
      createFakeDropZone(
        2,
        {
          x: 505,
          right: 505 + 500,
          y: 0,
          bottom: 1000,
        },
        []
      )
    );

    spectator.service.newDragPosition({
      x: 10,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service.newDragPosition({
      x: 505,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(over).toEqual({ dropZone: 2, over: undefined, source: [] });
        done();
      });
  });

  it('the only item is the dragging element', (done) => {
    const candidates = [
      createFakeDraggableDirective(1, false, createRectByIndex(0)),
    ];

    const zone = createFakeDropZone(
      1,
      {
        x: 0,
        right: 500,
        y: 0,
        bottom: 1000,
      },
      candidates
    );

    spectator.service.addDropZone(zone);

    spectator.service['initialZone'] = zone;

    spectator.service.newDragPosition({
      x: 10,
      y: 250,
      width: 300,
      height: 150,
    } as any);

    spectator.service
      .over()
      .pipe(take(1))
      .subscribe((over) => {
        expect(over).toEqual({ dropZone: 1, over: undefined, source: [] });
        done();
      });
  });
});
