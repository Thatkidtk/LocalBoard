import { expect, test } from "@playwright/test";

test("home page shows LocalBoard hero and trending posts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Every neighborhood needs a live pulse.")).toBeVisible();
  await expect(page.getByText("What neighbors are talking about")).toBeVisible();
});

test("community page loads feed content in demo mode", async ({ page }) => {
  await page.goto("/c/chelsea-ny-10001");
  await expect(page.getByText("Community board")).toBeVisible();
  await expect(page.getByText("Power outage near 14th Street and 8th Ave")).toBeVisible();
});

test("post page renders threaded comments", async ({ page }) => {
  await page.goto("/p/post-1");
  await expect(page.getByText("Community replies")).toBeVisible();
  await expect(page.getByText("City permit records show an emergency plumbing issue filed yesterday.")).toBeVisible();
});
