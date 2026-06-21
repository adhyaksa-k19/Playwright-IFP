import { test } from '@playwright/test';
import fs from 'fs';

interface MenuItem {
    menu_item_code: string;
    parent_item_code: string | null;
    menu_item_caption: string;
    level: number;
    order_number: number;
}

test('crawl available sidebar menus', async ({ page }) => {
    test.setTimeout(180_000);
    const menuResponse = page.waitForResponse((response) =>
        response.url().includes('/api/user_account/user_menu') && response.ok()
    );
    await page.goto('/dashboard');
    const response = await menuResponse;
    const body = await response.json();
    const items = body.data.user_menu as MenuItem[];
    const parents = new Map(
        items.filter((item) => item.level === 1)
            .map((item) => [item.menu_item_code, item])
    );

    const inventory: Array<{
        code: string;
        parent: string | null;
        caption: string;
        level: number;
        route: string | null;
    }> = [{
        code: 'DASHBOARD',
        parent: null,
        caption: 'Dashboard',
        level: 1,
        route: '/dashboard',
    }];

    const submenus = items
        .filter((item) => item.level === 2)
        .sort((a, b) => a.order_number - b.order_number);

    for (const item of submenus) {
        const parent = parents.get(item.parent_item_code ?? '');
        if (!parent) continue;

        await page.goto('/dashboard');
        await page.getByRole('button', {
            name: parent.menu_item_caption,
            exact: true,
        }).click();

        const menuButton = page.getByRole('button', {
            name: item.menu_item_caption,
            exact: true,
        });
        const isVisible = await menuButton.waitFor({
            state: 'visible',
            timeout: 1_500,
        }).then(() => true).catch(() => false);

        if (!isVisible) {
            inventory.push({
                code: item.menu_item_code,
                parent: parent.menu_item_caption,
                caption: item.menu_item_caption,
                level: item.level,
                route: null,
            });
            continue;
        }

        const previousUrl = page.url();
        await menuButton.click();

        let route: string | null = null;
        try {
            await page.waitForURL((url) => url.href !== previousUrl, { timeout: 5_000 });
            const currentUrl = new URL(page.url());
            route = `${currentUrl.pathname}${currentUrl.search}`;
        } catch {
            // Some menu entries open an action instead of navigating.
        }

        inventory.push({
            code: item.menu_item_code,
            parent: parent.menu_item_caption,
            caption: item.menu_item_caption,
            level: item.level,
            route,
        });
    }

    for (const item of items.filter((menu) => menu.level > 2)) {
        inventory.push({
            code: item.menu_item_code,
            parent: item.parent_item_code,
            caption: item.menu_item_caption,
            level: item.level,
            route: null,
        });
    }

    fs.writeFileSync('menu-inventory.json', JSON.stringify(inventory, null, 2));
    console.log(`Menu inventory: ${inventory.length} entries -> menu-inventory.json`);
});
