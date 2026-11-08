import { test, expect, type Page } from "@playwright/test"

/** V2 seed: teacher1 / Password@123 (BCrypt of Password@123) */
const TEACHER = { username: "teacher1", password: "Password@123" }

async function loginAsTeacher(page: Page) {
  await page.goto("/login")
  await page.getByLabel(/username/i).fill(TEACHER.username)
  await page.getByLabel(/password/i).fill(TEACHER.password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/teacher/, { timeout: 20_000 })
}

function navLink(page: Page, name: RegExp | string) {
  // Sidebar primary links are rounded-full anchors with the label text
  return page.locator("aside a, nav a").filter({ hasText: name }).first()
}

test.describe("Teacher GC polish smoke", () => {
  test("login → teacher home has no Publish new classwork; sidebar Classes/To-do", async ({
    page,
  }) => {
    await loginAsTeacher(page)

    await expect(page.getByText("Publish new classwork")).toHaveCount(0)
    await expect(page.getByText(/new assignment/i)).toHaveCount(0)

    const classesLink = navLink(page, /^Classes$/)
    const todoLink = navLink(page, /^To-do$/)
    await expect(classesLink).toBeVisible()
    await expect(todoLink).toBeVisible()

    // Empty hash / #classes ⇒ Classes active (success green pill)
    await classesLink.click()
    await expect(page).toHaveURL(/\/teacher(#classes)?$/)
    await expect(classesLink).toHaveClass(/bg-\[hsl\(var\(--success\)\)\]/)

    await todoLink.click()
    await expect(page).toHaveURL(/\/teacher#todo/)
    await expect(todoLink).toHaveClass(/bg-\[hsl\(var\(--success\)\)\]/)
    await expect(page.getByRole("heading", { name: /^To-do$/ })).toBeVisible()

    await classesLink.click()
    await expect(classesLink).toHaveClass(/bg-\[hsl\(var\(--success\)\)\]/)
  })

  test("open class → Classwork shows Create; settings page loads", async ({ page }) => {
    await loginAsTeacher(page)

    // Seeded teacher1 owns classes — open first class card
    const classCard = page.locator('a[href^="/classes/"]').first()
    await expect(classCard).toBeVisible({ timeout: 20_000 })
    await classCard.click()
    await expect(page).toHaveURL(/\/classes\/\d+/)

    // Classwork tab (VI label on UI)
    await page.getByRole("tab", { name: /Bài tập trên lớp|Classwork|Assignments/i }).click()
    // Prefer the assignment Create dialog trigger (not other aria-label="Create" menus)
    const createClasswork = page.locator('button[aria-haspopup="dialog"]').filter({
      hasText: /^Create$/,
    })
    await expect(createClasswork).toBeVisible()

    // Settings gear
    await page.getByRole("link", { name: /class settings/i }).click()
    await expect(page).toHaveURL(/\/classes\/\d+\/settings/)
    await expect(page.getByText(/class settings/i).first()).toBeVisible()
  })
})
