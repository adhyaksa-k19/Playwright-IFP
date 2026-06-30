import { test } from '@playwright/test';
import fs from 'fs';

interface MenuItem {
    menu_item_code: string;
    parent_item_code: string | null;
    menu_item_caption: string;
    level: number;
    order_number: number;
}

interface InventoryItem {
    code: string;
    parent: string | null;
    caption: string;
    level: number;
    route: string | null;
}

const labelAliases: Record<string, string[]> = {
    Transaksi: ['Transaction'],
    'Menu Administrasi': ['Administration Menu'],
    'Akun User': ['User Account'],
};

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findMenuButton(
    page: import('@playwright/test').Page,
    caption: string
) {
    const labels = [caption, ...(labelAliases[caption] ?? [])];
    const pattern = new RegExp(`^(${labels.map(escapeRegex).join('|')})$`);
    const button = page.getByRole('button', { name: pattern }).first();
    const isVisible = await button.waitFor({
        state: 'visible',
        timeout: 1_500,
    }).then(() => true).catch(() => false);

    return isVisible ? button : null;
}

test('crawl available sidebar menus', async ({ page }) => {
    test.setTimeout(180_000);
    const currentInventory = fs.existsSync('menu-inventory.json')
        ? JSON.parse(fs.readFileSync('menu-inventory.json', 'utf8')) as InventoryItem[]
        : [];
    const knownRoutes = new Map(
        currentInventory.map((item) => [item.code, item.route])
    );

    const menuResponse = page.waitForResponse((response) =>
        response.url().includes('/api/user_account/user_menu') && response.ok()
    );
    await page.goto('/dashboard');
    const response = await menuResponse;
    const body = await response.json();
    const items = body.data.user_menu as MenuItem[];

    const switchToIndonesian = page.getByRole('button', {
        name: 'Bahasa Indonesia',
    });
    if (await switchToIndonesian.isVisible().catch(() => false)) {
        await switchToIndonesian.click();
        await page.waitForTimeout(500);
    }

    const parents = new Map(
        items.filter((item) => item.level === 1)
            .map((item) => [item.menu_item_code, item])
    );

    const inventory: InventoryItem[] = [{
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
        const parentButton = await findMenuButton(page, parent.menu_item_caption);
        if (!parentButton) {
            inventory.push({
                code: item.menu_item_code,
                parent: parent.menu_item_caption,
                caption: item.menu_item_caption,
                level: item.level,
                route: knownRoutes.get(item.menu_item_code) ?? null,
            });
            continue;
        }

        await parentButton.click();

        const menuButton = await findMenuButton(page, item.menu_item_caption);

        if (!menuButton) {
            inventory.push({
                code: item.menu_item_code,
                parent: parent.menu_item_caption,
                caption: item.menu_item_caption,
                level: item.level,
                route: knownRoutes.get(item.menu_item_code) ?? null,
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
            route = knownRoutes.get(item.menu_item_code) ?? null;
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
            route: knownRoutes.get(item.menu_item_code) ?? null,
        });
    }

    fs.writeFileSync('menu-inventory.json', JSON.stringify(inventory, null, 2));
    console.log(`Menu inventory: ${inventory.length} entries -> menu-inventory.json`);
});
