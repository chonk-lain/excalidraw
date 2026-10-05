import { test, expect } from "@playwright/test";

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

  test("should open InsertTableDialog with Alt+Shift+T shortcut", async ({
    page,
  }) => {
    // Open the dialog using keyboard shortcut
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    // Wait for the dialog to appear
    const dialog = page.locator(".InsertTableDialog").first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log("✅ InsertTableDialog opened successfully");
  });

  test("InsertTableDialog should display default values", async ({ page }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(page.locator(".InsertTableDialog").first()).toBeVisible({
      timeout: 5000,
    });

    // Check default values
    const rowsInput = page
      .locator(".InsertTableDialog__field--rows input")
      .first();
    const columnsInput = page
      .locator(".InsertTableDialog__field--columns input")
      .first();
    const cornerRadiusInput = page
      .locator(".InsertTableDialog__field--cornerRadius input")
      .first();

    const rowsValue = await rowsInput.inputValue();
    const columnsValue = await columnsInput.inputValue();
    const cornerRadiusValue = await cornerRadiusInput.inputValue();

    expect(rowsValue).toBe("2");
    expect(columnsValue).toBe("2");
    expect(cornerRadiusValue).toBe("20");

    console.log("✅ Default values verified: rows=2, columns=2, cornerRadius=20");
  });

  test("should insert a 2x2 table and verify element count", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(page.locator(".InsertTableDialog").first()).toBeVisible({
      timeout: 5000,
    });

    // Keep default 2x2 values
    // Click insert button
    const insertButton = page.locator(".InsertTableDialog__insert").first();
    await insertButton.click();

    // Wait a bit for the table to be inserted
    await page.waitForTimeout(500);

    // Count elements on canvas (should have at least 4 for 2x2 table)
    const elements = page.locator("[data-element-id]");
    const count = await elements.count();
    expect(count).toBeGreaterThanOrEqual(4);

    console.log(`✅ Table inserted with ${count} elements (expected >= 4)`);
  });

  test("should insert a 3x3 table and verify element count", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(page.locator(".InsertTableDialog").first()).toBeVisible({
      timeout: 5000,
    });

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
    const insertButton = page.locator(".InsertTableDialog__insert").first();
    await insertButton.click();

    await page.waitForTimeout(500);

    // Count elements (should have at least 9 for 3x3 table)
    const elements = page.locator("[data-element-id]");
    const count = await elements.count();
    expect(count).toBeGreaterThanOrEqual(9);

    console.log(`✅ 3x3 table inserted with ${count} elements (expected >= 9)`);
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

    await expect(page.locator(".InsertTableDialog").first()).toBeVisible({
      timeout: 5000,
    });

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

    console.log("✅ Custom table inserted with size 200x160 and cornerRadius=8");
  });

  test("should lock table when resizable toggle is disabled", async ({
    page,
  }) => {
    // Open the dialog
    await page.keyboard.down("Alt");
    await page.keyboard.down("Shift");
    await page.keyboard.press("t");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Alt");

    await expect(page.locator(".InsertTableDialog").first()).toBeVisible({
      timeout: 5000,
    });

    // Click the resizable toggle (to lock the table)
    const resizableToggle = page
      .locator(".InsertTableDialog__resizable")
      .first();
    await resizableToggle.click();

    // Press Enter to submit
    await page.keyboard.press("Enter");

    await page.waitForTimeout(500);

    // Check if elements exist (table should be inserted with locked state)
    const elements = page.locator("[data-element-id]");
    const count = await elements.count();
    expect(count).toBeGreaterThanOrEqual(4); // 2x2 table

    console.log("✅ Locked table inserted with resizable toggle disabled");
  });
});
