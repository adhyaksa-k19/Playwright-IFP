import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

interface MenuItem {
    code: string;
    parent: string | null;
    caption: string;
    level: number;
    route: string | null;
}

interface DumpResult extends MenuItem {
    status: 'captured' | 'captured-via-menu' | 'unavailable' | 'failed';
    output: string | null;
    finalUrl: string | null;
    detail?: string;
}

const inventory = JSON.parse(
    fs.readFileSync('menu-inventory.json', 'utf8')
) as MenuItem[];

const outputDirectory = 'aria-snapshots';
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

async function waitUntilReady(page: import('@playwright/test').Page) {
    await page.waitForLoadState('domcontentloaded');
    const loading = page.getByText(/Loading(?: data)?\.\.\./).first();
    await page.waitForTimeout(500);
    if (await loading.isVisible().catch(() => false)) {
        await expect(loading).toBeHidden({ timeout: 60_000 });
    }
}

async function openFromMenu(
    page: import('@playwright/test').Page,
    item: MenuItem
) {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const main = page.getByRole('main');
    const isDashboardVisible = await main.waitFor({
        state: 'visible',
        timeout: 5_000,
    }).then(() => true).catch(() => false);
    if (!isDashboardVisible) return false;

    if (item.level === 2 && item.parent) {
        const parent = await findMenuButton(page, item.parent);
        if (!parent) return false;
        await parent.click();
    } else if (item.level > 2) {
        // Level-three inventory entries use the parent menu code. Open each
        // visible ancestor by following the inventory relationship.
        const parentItem = inventory.find((candidate) => candidate.code === item.parent);
        if (!parentItem) return false;
        if (parentItem.parent) {
            const grandparent = await findMenuButton(page, parentItem.parent);
            if (grandparent) {
                await grandparent.click();
            }
        }
        const parent = await findMenuButton(page, parentItem.caption);
        if (parent) await parent.click();
    }

    const menu = await findMenuButton(page, item.caption);
    if (!menu) return false;
    await menu.click();
    await page.waitForTimeout(1_000);
    return true;
}

test('dump ARIA snapshots for every menu inventory entry', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    fs.mkdirSync(outputDirectory, { recursive: true });
    const results: DumpResult[] = [];

    for (const item of inventory) {
        const output = path.join(outputDirectory, `${item.code.toLowerCase()}.txt`);
        try {
            let status: DumpResult['status'] = 'captured';
            if (item.route) {
                await page.goto(item.route, { waitUntil: 'domcontentloaded' });
                await waitUntilReady(page);
            } else {
                const opened = await openFromMenu(page, item);
                if (!opened) {
                    results.push({
                        ...item,
                        status: 'unavailable',
                        output: null,
                        finalUrl: page.url(),
                        detail: 'Menu tidak terlihat dan inventory tidak memiliki route.',
                    });
                    console.log(`SKIP ${item.code}: no route and menu is not visible`);
                    continue;
                }
                status = 'captured-via-menu';
                await waitUntilReady(page);
            }

            const snapshot = await page.locator('body').ariaSnapshot();
            fs.writeFileSync(output, snapshot);
            results.push({
                ...item,
                status,
                output: output.replaceAll('\\', '/'),
                finalUrl: page.url(),
            });
            console.log(`OK   ${item.code} -> ${output}`);
        } catch (error) {
            results.push({
                ...item,
                status: 'failed',
                output: null,
                finalUrl: page.url(),
                detail: error instanceof Error ? error.message : String(error),
            });
            console.log(`FAIL ${item.code}`);
        }
    }

    fs.writeFileSync(
        path.join(outputDirectory, 'manifest.json'),
        JSON.stringify(results, null, 2)
    );

    expect(results).toHaveLength(inventory.length);
    expect(results.filter((result) => result.status === 'failed')).toEqual([]);
});
