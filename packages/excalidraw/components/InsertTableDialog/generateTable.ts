import { getStrokeWidthByKey, randomId, ROUNDNESS } from "@excalidraw/common";
import { newElement, TABLE_CELL_CUSTOM_DATA_KEY } from "@excalidraw/element";
import { clamp } from "@excalidraw/math";

import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";

import type { AppState } from "../../types";

export const TABLE_MAX_CELLS_PER_AXIS = 50;

export type TableOptions = {
  rows: number;
  columns: number;
  /** total table width, including spacing between cells */
  width: number;
  /** total table height, including spacing between cells */
  height: number;
  cellSpacing: number;
  cornerRadius: number;
  locked: boolean;
};

const toFinite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

export const normalizeTableOptions = (opts: TableOptions): TableOptions => {
  const rows = clamp(
    Math.round(toFinite(opts.rows, 1)),
    1,
    TABLE_MAX_CELLS_PER_AXIS,
  );
  const columns = clamp(
    Math.round(toFinite(opts.columns, 1)),
    1,
    TABLE_MAX_CELLS_PER_AXIS,
  );
  const cellSpacing = Math.max(0, toFinite(opts.cellSpacing, 0));
  // every cell must be at least 1px on each axis
  const width = Math.max(
    columns + (columns - 1) * cellSpacing,
    toFinite(opts.width, 0),
  );
  const height = Math.max(
    rows + (rows - 1) * cellSpacing,
    toFinite(opts.height, 0),
  );

  return {
    rows,
    columns,
    width,
    height,
    cellSpacing,
    cornerRadius: Math.max(0, toFinite(opts.cornerRadius, 0)),
    locked: !!opts.locked,
  };
};

/**
 * Generates a grid of grouped rectangles laid out from origin (0, 0).
 * Cells use the current item styles so they match the user's other shapes.
 */
export const generateTableElements = (
  options: TableOptions,
  appState: Pick<
    AppState,
    | "currentItemStrokeColor"
    | "currentItemBackgroundColor"
    | "currentItemFillStyle"
    | "currentItemStrokeWidthKey"
    | "currentItemStrokeStyle"
    | "currentItemRoughness"
    | "currentItemOpacity"
  >,
): NonDeletedExcalidrawElement[] => {
  const { rows, columns, width, height, cellSpacing, cornerRadius, locked } =
    normalizeTableOptions(options);

  const cellWidth = (width - (columns - 1) * cellSpacing) / columns;
  const cellHeight = (height - (rows - 1) * cellSpacing) / rows;
  const groupId = randomId();
  const roundness =
    cornerRadius > 0
      ? { type: ROUNDNESS.ADAPTIVE_RADIUS, value: cornerRadius }
      : null;

  const elements: NonDeletedExcalidrawElement[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      elements.push(
        newElement({
          type: "rectangle",
          x: column * (cellWidth + cellSpacing),
          y: row * (cellHeight + cellSpacing),
          width: cellWidth,
          height: cellHeight,
          strokeColor: appState.currentItemStrokeColor,
          backgroundColor: appState.currentItemBackgroundColor,
          fillStyle: appState.currentItemFillStyle,
          strokeWidth: getStrokeWidthByKey(
            "rectangle",
            appState.currentItemStrokeWidthKey,
          ),
          strokeStyle: appState.currentItemStrokeStyle,
          roughness: appState.currentItemRoughness,
          opacity: appState.currentItemOpacity,
          roundness,
          groupIds: [groupId],
          locked,
          customData: { [TABLE_CELL_CUSTOM_DATA_KEY]: true },
        }),
      );
    }
  }

  return elements;
};
