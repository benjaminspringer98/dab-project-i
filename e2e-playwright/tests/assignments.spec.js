const { test, expect } = require("@playwright/test");

test("Providing the wrong answer shows text 'Incorrect'", async ({ page }) => {
  await page.goto("/");
  const code = randomString(50);
  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#resultText")).toHaveText("Incorrect");
});

test("Providing the correct answer shows text 'Correct!'", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);
  const title = await page.locator("#title").textContent();
  const code = getCorrectCode(title);

  await page.locator("#code").fill(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#resultText")).toHaveText("Correct!");
});

test("Providing the correct answer allows user to move to next assignment", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);
  const title = await page.locator("#title").textContent();
  const code = getCorrectCode(title);

  await page.locator("#code").fill(code);
  await page.locator("#submitBtn").click();
  await page.locator("#nextAssignment").click();

  await expect(page.locator("#title")).not.toHaveText(title);
});

test("Providing the correct answer increases user points", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);
  const points = await page.locator("#points").textContent();
  const title = await page.locator("#title").textContent();
  const code = getCorrectCode(title);

  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#points")).not.toHaveText(`${points}`);
});

test("Providing wrong answer does not increase user points", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(1000);
  const points = await page.locator("#points").textContent();
  const code = randomString(50);
  await page.locator("#code").type(code);
  await page.locator("#submitBtn").click();

  await expect(page.locator("#points")).toHaveText(`${points}`);
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

const getCorrectCode = (title) => {
  let code = "";
  switch (title) {
    case "Hello":
      code = `def hello():
  return "Hello"`;
      break;
    case "Hello world":
      code = `def hello():
  return "Hello world"`;
      break;
    case "Sum":
      code = `def sum(a, b):
  return a + b`;
    default:
      break;
  }

  return code;
}