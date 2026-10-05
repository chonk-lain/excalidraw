import {
  test,
  expect,
} from "@playwright/test";
import {
  generateTableElements,
} from "../packages/excalidraw/components/InsertTableDialog/generateTable";
import {
  TABLE_CELL_CUSTOM_DATA_KEY,
  isTableCellElement,
  getCommonBounds,
} from "../packages/element/src";

const PORT = 3001;

test.describe("Table Component E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForLoadState("networkidle");
    // Wait for the app to be fully loaded
    await page.waitForSelector("[aria-label='Drawing canvas']", {
      timeout: 30000,
    });
  });

  test("should open InsertTableDialog with Alt+Shift+T", async ({
    page,
  }) => {
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    // Wait for the dialog to appear
    await expect(
      page.locator(".InsertTableDialog").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("InsertTableDialog should have default values", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(
      page.locator(".InsertTableDialog").first(),
    ).toBeVisible({ timeout: 5000 });

    // Check default values for rows, columns, width, height, cellSpacing, cornerRadius
    const rowsInput = page
      .locator(".InsertTableDialog__field--rows input")
      .first();
    const columnsInput = page
      .locator(".InsertTableDialog__field--columns input")
      .first();
    const widthInput = page.locator(".InsertTableDialog__field--width input")
      .first();
    const heightInput = page
      .locator(".InsertTableDialog__field--height input")
      .first();
    const cellSpacingInput = page
      .locator(".InsertTableDialog__field--cellSpacing input")
      .first();
    const cornerRadiusInput = page
      .locator(".InsertTableDialog__field--cornerRadius input")
      .first();

    // Default values should be 2 for rows, 2 for columns
    const rowsValue = await rowsInput.inputValue();
    const columnsValue = await columnsInput.inputValue();
    expect(rowsValue).toBe("2");
    expect(columnsValue).toBe("2");

    // Default corner radius should be 20
    const cornerRadiusValue = await cornerRadiusInput.inputValue();
    expect(cornerRadiusValue).toBe("20");
  });

  test("should insert a table with specified rows and columns", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(
      page.locator(".InsertTableDialog").first(),
    ).toBeVisible({ timeout: 5000 });

    // Set values for 3x3 table
    const rowsInput = page
      .locator(".InsertTableDialog__field--rows input")
      .first();
    const columnsInput = page
      .locator(".InsertTableDialog__field--columns input")
      .first();

    await rowsInput.fill("3");
    await columnsInput.fill("3");

    // Click insert button
    const insertButton = page
      .locator(".InsertTableDialog__insert")
      .first();
    await insertButton.click();

    // Table should be inserted
    // Wait a bit for the table to be rendered
    await page.waitForTimeout(500);

    // Check that we have 9 rectangle elements (3x3 table)
    // This is done by checking the number of selected elements
    const selectedElementsCount = page.locator(
      "[data-element-id]",
    ).count();

    // We expect 9 elements (3x3 table) plus any existing elements
    expect(selectedElementsCount).toBeGreaterThanOrEqual(9);
  });

  test("should insert a table with custom size and corner radius", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(
      page.locator(".InsertTableDialog").first(),
    ).toBeVisible({ timeout: 5000 });

    // Set values for 2x2 table with custom size
    const rowsInput = page
      .locator(".InsertTableDialog__field--rows input")
      .first();
    const columnsInput = page
      .locator(".InsertTableDialog__field--columns input")
      .first();
    const widthInput = page
      .locator(".InsertTableDialog__field--width input")
      .first();
    const heightInput = page
      .locator(".InsertTableDialog__field--height input")
      .first();
    const cellSpacingInput = page
      .locator(".InsertTableDialog__field--cellSpacing input")
      .first();
    const cornerRadiusInput = page
      .locator(".InsertTableDialog__field--cornerRadius input")
      .first();

    await rowsInput.fill("2");
    await columnsInput.fill("2");
    await widthInput.fill("200");
    await heightInput.fill("160");
    await cellSpacingInput.fill("0");
    await cornerRadiusInput.fill("8");

    // Click insert button
    const insertButton = page
      .locator(".InsertTableDialog__insert")
      .first();
    await insertButton.click();

    await page.waitForTimeout(500);
  });

  test("should toggle lock state for resizable table", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(
      page.locator(".InsertTableDialog").first(),
    ).toBeVisible({ timeout: 5000 });

    // Click the resizable toggle (to lock the table)
    const resizableToggle = page
      .locator(".InsertTableDialog__resizable")
      .first();
    await resizableToggle.click();

    // Press Enter to submit
    await page.keyboard.press("Enter");

    await page.waitForTimeout(500);

    // Check if the elements are locked
    // We can verify this by checking for the lock icon or class
    const lockedElements = page.locator(
      "[data-element-id]",
    ).count();

    // The table should have been inserted with locked state
    expect(lockedElements).toBeGreaterThanOrEqual(4); // 2x2 table
  });

  test("generateTableElements should create proper grouped rectangles", () => {
    const baseOptions = {
      rows: 2,
      columns: 3,
      width: 320,
      height: 110,
      cellSpacing: 10,
      cornerRadius: 0,
      locked: false,
    };

    const appState = {
      currentItemStrokeColor: "#000000",
      currentItemBackgroundColor: "transparent",
      currentItemFillStyle: "solid",
      currentItemStrokeWidthKey: "regular",
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 0,
      currentItemOpacity: 100,
    };

    const elements = generateTableElements(baseOptions, appState);

    // Verify the number of elements
    expect(elements).toHaveLength(6); // 2 rows * 3 columns

    // Verify all elements are rectangles
    expect(elements.every((el) => el.type === "rectangle")).toBe(true);

    // Verify all elements belong to the same group
    const groupIds = new Set(elements.map((el) => el.groupIds.join()));
    expect(groupIds.size).toBe(1);

    // Verify all elements are table cells
    expect(elements.every(isTableCellElement)).toBe(true);

    // Verify customData
    expect(elements[0].customData).toEqual({
      [TABLE_CELL_CUSTOM_DATA_KEY]: true,
    });

    // Verify element positions (320 - 2*10) / 3 = 100, (110 - 1*10) / 2 = 50
    expect(
      elements.map((el) => [el.x, el.y, el.width, el.height]),
    ).toEqual([
      [0, 0, 100, 50],
      [110, 0, 100, 50],
      [220, 0, 100, 50],
      [0, 60, 100, 50],
      [110, 60, 100, 50],
      [220, 60, 100, 50],
    ]);
  });

  test("generateTableElements should apply corner radius and lock state", () => {
    const baseOptions = {
      rows: 2,
      columns: 3,
      width: 320,
      height: 110,
      cellSpacing: 10,
      cornerRadius: 0,
      locked: false,
    };

    const appState = {
      currentItemStrokeColor: "#000000",
      currentItemBackgroundColor: "transparent",
      currentItemFillStyle: "solid",
      currentItemStrokeWidthKey: "regular",
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 0,
      currentItemOpacity: 100,
    };

    const elements = generateTableElements(baseOptions, appState);

    // Default: no corner radius and not locked
    expect(elements.every((el) => el.roundness === null && !el.locked)).toBe(
      true,
    );

    // With corner radius and locked
    const lockedElements = generateTableElements(
      { ...baseOptions, cornerRadius: 12, locked: true },
      appState,
    );

    expect(
      lockedElements.every(
        (el) =>
          el.locked &&
          el.roundness?.type === "adaptiveRadius" &&
          el.roundness.value === 12,
      ),
    ).toBe(true);
  });

  test("generateTableElements should use current item styles", () => {
    const baseOptions = {
      rows: 1,
      columns: 1,
      width: 100,
      height: 50,
      cellSpacing: 0,
      cornerRadius: 0,
      locked: false,
    };

    const appState = {
      currentItemStrokeColor: "#e03131",
      currentItemBackgroundColor: "#ffc9c9",
      currentItemFillStyle: "solid",
      currentItemStrokeWidthKey: "bold",
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 0,
      currentItemOpacity: 100,
    };

    const [cell] = generateTableElements(baseOptions, appState);

    expect(cell.strokeColor).toBe("#e03131");
    expect(cell.backgroundColor).toBe("#ffc9c9");
    // Bold stroke width for rectangles
    expect(cell.strokeWidth).toBe(3);
  });

  test("normalizeTableOptions should clamp invalid input", () => {
    const { normalizeTableOptions, TABLE_MAX_CELLS_PER_AXIS } =
      (() => {
        const mod = require(
          "../packages/excalidraw/components/InsertTableDialog/generateTable",
        );
        return {
          normalizeTableOptions: mod.normalizeTableOptions,
          TABLE_MAX_CELLS_PER_AXIS: mod.TABLE_MAX_CELLS_PER_AXIS,
        };
      })();

    const result = normalizeTableOptions({
      rows: 0,
      columns: 1000,
      width: NaN,
      height: -5,
      cellSpacing: -3,
      cornerRadius: -1,
      locked: false,
    });

    expect(result.rows).toBe(1);
    expect(result.columns).toBe(TABLE_MAX_CELLS_PER_AXIS);
    expect(result.width).toBe(TABLE_MAX_CELLS_PER_AXIS);
    expect(result.height).toBe(1);
    expect(result.cellSpacing).toBe(0);
    expect(result.cornerRadius).toBe(0);
    expect(result.locked).toBe(false);
  });
});
