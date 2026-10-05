import { CODES, getStrokeWidthByKey, ROUNDNESS } from "@excalidraw/common";

import {
  getCommonBounds,
  isTableCellElement,
  TABLE_CELL_CUSTOM_DATA_KEY,
} from "@excalidraw/element";

import { Excalidraw } from "../index";
import { getDefaultAppState } from "../appState";
import {
  generateTableElements,
  normalizeTableOptions,
  TABLE_MAX_CELLS_PER_AXIS,
} from "../components/InsertTableDialog/generateTable";

import { API } from "./helpers/api";
import { Keyboard, UI } from "./helpers/ui";
import {
  act,
  fireEvent,
  render,
  unmountComponent,
  waitFor,
} from "./test-utils";

import type { TableOptions } from "../components/InsertTableDialog/generateTable";

unmountComponent();

const h = window.h;

const appState = getDefaultAppState();

const baseOptions: TableOptions = {
  rows: 2,
  columns: 3,
  width: 320,
  height: 110,
  cellSpacing: 10,
  cornerRadius: 0,
  locked: false,
};

describe("generateTableElements", () => {
  it("creates rows × columns grouped rectangles laid out with spacing", () => {
    const elements = generateTableElements(baseOptions, appState);

    expect(elements).toHaveLength(6);
    expect(elements.every((el) => el.type === "rectangle")).toBe(true);

    const groupIds = new Set(elements.map((el) => el.groupIds.join()));
    expect(groupIds.size).toBe(1);
    expect(elements[0].groupIds).toHaveLength(1);
    expect(elements.every(isTableCellElement)).toBe(true);
    expect(elements[0].customData).toEqual({
      [TABLE_CELL_CUSTOM_DATA_KEY]: true,
    });

    // (320 - 2 * 10) / 3 = 100, (110 - 1 * 10) / 2 = 50
    expect(elements.map((el) => [el.x, el.y, el.width, el.height])).toEqual([
      [0, 0, 100, 50],
      [110, 0, 100, 50],
      [220, 0, 100, 50],
      [0, 60, 100, 50],
      [110, 60, 100, 50],
      [220, 60, 100, 50],
    ]);
  });

  it("applies corner radius and lock state", () => {
    expect(
      generateTableElements(baseOptions, appState).every(
        (el) => el.roundness === null && !el.locked,
      ),
    ).toBe(true);

    const elements = generateTableElements(
      { ...baseOptions, cornerRadius: 12, locked: true },
      appState,
    );
    expect(
      elements.every(
        (el) =>
          el.locked &&
          el.roundness?.type === ROUNDNESS.ADAPTIVE_RADIUS &&
          el.roundness.value === 12,
      ),
    ).toBe(true);
  });

  it("uses current item styles", () => {
    const [cell] = generateTableElements(baseOptions, {
      ...appState,
      currentItemStrokeColor: "#e03131",
      currentItemBackgroundColor: "#ffc9c9",
      currentItemStrokeWidthKey: "bold",
    });
    expect(cell.strokeColor).toBe("#e03131");
    expect(cell.backgroundColor).toBe("#ffc9c9");
    expect(cell.strokeWidth).toBe(getStrokeWidthByKey("rectangle", "bold"));
  });

  it("clamps invalid input", () => {
    expect(
      normalizeTableOptions({
        rows: 0,
        columns: 1000,
        width: NaN,
        height: -5,
        cellSpacing: -3,
        cornerRadius: -1,
        locked: false,
      }),
    ).toEqual({
      rows: 1,
      columns: TABLE_MAX_CELLS_PER_AXIS,
      width: TABLE_MAX_CELLS_PER_AXIS,
      height: 1,
      cellSpacing: 0,
      cornerRadius: 0,
      locked: false,
    });
  });
});

describe("InsertTableDialog", () => {
  const getInput = (field: string) =>
    document.querySelector(
      `.InsertTableDialog__field--${field} input`,
    ) as HTMLInputElement;

  const setField = (field: string, value: string) =>
    fireEvent.change(getInput(field), { target: { value } });

  it("opens with Alt+Shift+T", async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);

    Keyboard.withModifierKeys({ alt: true, shift: true }, () => {
      Keyboard.codePress(CODES.T);
    });

    await waitFor(() => {
      expect(h.state.openDialog).toEqual({ name: "insertTable" });
      expect(document.querySelector(".InsertTableDialog")).not.toBeNull();
    });
  });

  it("defaults the corner radius to 20", async () => {
    await render(
      <Excalidraw
        initialData={{ appState: { openDialog: { name: "insertTable" } } }}
      />,
    );

    await waitFor(() => {
      expect(getInput("cornerRadius").value).toBe("20");
    });

    fireEvent.keyDown(getInput("rows"), { key: "Enter" });

    expect(h.elements).toHaveLength(9);
    expect(h.elements.every((el) => el.roundness?.value === 20)).toBe(true);
  });

  it("inserts a grouped table with the requested size", async () => {
    await render(
      <Excalidraw
        initialData={{ appState: { openDialog: { name: "insertTable" } } }}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".InsertTableDialog")).not.toBeNull();
    });

    setField("rows", "4");
    setField("columns", "2");
    setField("width", "200");
    setField("height", "160");
    setField("cellSpacing", "0");
    setField("cornerRadius", "8");

    act(() => {
      fireEvent.click(
        document.querySelector(".InsertTableDialog__insert") as HTMLElement,
      );
    });

    expect(h.state.openDialog).toBe(null);
    expect(h.elements).toHaveLength(8);

    const [minX, minY, maxX, maxY] = getCommonBounds(h.elements);
    expect(maxX - minX).toBeCloseTo(200);
    expect(maxY - minY).toBeCloseTo(160);

    expect(new Set(h.elements.map((el) => el.groupIds[0])).size).toBe(1);
    expect(h.elements.every((el) => el.roundness?.value === 8)).toBe(true);
    expect(h.elements.every((el) => !el.locked)).toBe(true);
    expect(Object.keys(h.state.selectedElementIds)).toHaveLength(8);
  });

  it("locks the table when resizing is disabled", async () => {
    await render(
      <Excalidraw
        initialData={{ appState: { openDialog: { name: "insertTable" } } }}
      />,
    );

    await waitFor(() => {
      expect(document.querySelector(".InsertTableDialog")).not.toBeNull();
    });

    fireEvent.click(
      document.querySelector(".InsertTableDialog__resizable") as HTMLElement,
    );
    // Enter inside a field inserts too
    fireEvent.keyDown(getInput("rows"), { key: "Enter" });

    expect(h.elements).toHaveLength(9);
    expect(h.elements.every((el) => el.locked)).toBe(true);
  });
});

describe("resizing a table", () => {
  beforeEach(async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  const selectTable = () => {
    const elements = generateTableElements(baseOptions, appState);
    API.setElements(elements);
    API.setSelectedElements(elements);
    return elements;
  };

  it("does not keep the aspect ratio of the whole table", () => {
    const cells = selectTable();

    UI.resize(cells, "se", [160, 0]);

    const [minX, minY, maxX, maxY] = getCommonBounds(h.elements);
    expect(maxX - minX).toBeCloseTo(baseOptions.width + 160);
    expect(maxY - minY).toBeCloseTo(baseOptions.height);
  });

  it("still keeps the aspect ratio for regular groups", () => {
    const rectangles = [
      API.createElement({ type: "rectangle", x: 0, width: 100, height: 50 }),
      API.createElement({ type: "rectangle", x: 150, width: 100, height: 50 }),
    ].map((el) => ({ ...el, groupIds: ["group"] }));
    API.setElements(rectangles);
    API.setSelectedElements(rectangles);

    const [x1, y1, x2, y2] = getCommonBounds(h.elements);
    UI.resize(rectangles, "se", [250, 0]);
    const [minX, minY, maxX, maxY] = getCommonBounds(h.elements);

    expect(maxX - minX).toBeCloseTo(x2 - x1 + 250);
    expect((maxX - minX) / (maxY - minY)).toBeCloseTo((x2 - x1) / (y2 - y1));
  });
});
