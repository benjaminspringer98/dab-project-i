const { test, expect } = require("@playwright/test");

test("Providing the wrong answer shows text 'Incorrect'", async ({ page }) => {
  await page.goto("/assignments/1");
  const code = randomString(50);
  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#resultText")).toHaveText("Incorrect");
});

test("Providing the correct answer shows text 'Correct!'", async ({ page }) => {
  await page.goto("/assignments/1");
  const code = `def hello():
  return "Hello"`;
  await page.locator("#code").fill(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#resultText")).toHaveText("Correct!");
});

test("Providing the correct answer allows user to move to next assignment", async ({ page }) => {
  await page.goto("/assignments/1");
  const title = await page.locator("#title").textContent();
  const code = `def hello():
  return "Hello"`;
  await page.locator("#code").fill(code);
  await page.locator("#submitBtn").click();
  await page.locator("#nextAssignment").click();
  await expect(page.locator("#title")).not.toHaveText(title);
});

test("Providing the correct answer increases user points", async ({ page }) => {
  await page.goto("/assignments/1");
  const points = await page.locator("#points").textContent();
  const code = `def hello():
  return "Hello"`;
  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#points")).not.toHaveText(points);
});

test("Providing wrong answer does not increase user points", async ({ page }) => {
  await page.goto("/assignments/1");
  const points = await page.locator("#points").textContent();
  const code = randomString(50);
  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#points")).toHaveText(points);
});

const randomString = (length) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};