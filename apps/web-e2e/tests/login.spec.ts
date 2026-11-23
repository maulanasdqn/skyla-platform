import { adminPathOf, webPathOf } from "@app/contract";
import { AUTH_MESSAGE, CHAT_SCREEN_MESSAGE, NAV_MESSAGE } from "@app/messages";
import { expect, test } from "@playwright/test";

test("signs in and lands on the chat", async ({ page }): Promise<void> => {
	await page.goto(webPathOf("/login"));

	await page
		.getByLabel(AUTH_MESSAGE.FIELD_EMAIL)
		.pressSequentially("admin@test.app");
	await page
		.getByLabel(AUTH_MESSAGE.FIELD_PASSWORD)
		.pressSequentially("Password123");
	await page.getByRole("button", { name: AUTH_MESSAGE.LOGIN_ACTION }).click();

	await expect(page).toHaveURL(/\/app\/chat/);
	await expect(
		page.getByRole("textbox", { name: CHAT_SCREEN_MESSAGE.COMPOSER_LABEL }),
	).toBeVisible();
});

test("returns to the page that asked for sign-in", async ({
	page,
}): Promise<void> => {
	await page.goto(adminPathOf("/users?page=2"));
	await expect(page).toHaveURL(/\/login\?redirect=/);

	await page
		.getByLabel(AUTH_MESSAGE.FIELD_EMAIL)
		.pressSequentially("admin@test.app");
	await page
		.getByLabel(AUTH_MESSAGE.FIELD_PASSWORD)
		.pressSequentially("Password123");
	await page.getByRole("button", { name: AUTH_MESSAGE.LOGIN_ACTION }).click();

	await expect(page).toHaveURL(/\/users\?page=2(&|$)/);
	await expect(
		page.getByRole("heading", { name: NAV_MESSAGE.USERS }),
	).toBeVisible();
});
