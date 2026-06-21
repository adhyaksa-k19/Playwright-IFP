import { test } from '@playwright/test';
import {
    RekapProgressPage,
    RekapWilayahPage,
    SlaReportPage,
} from '../pages/ReportPages';

test.describe('Report - Rekap Progress', () => {
    test.describe.configure({ timeout: 180_000 });

    test('filter dan reset', async ({ page }) => {
        const report = new RekapProgressPage(page);
        await report.goto();
        await report.verifyPageLoaded();
        await report.filterAndReset();
    });
});

for (const kind of ['koordinator', 'teknisi'] as const) {
    test.describe(`Report - SLA ${kind}`, () => {
        test.describe.configure({ timeout: 180_000 });

        test('filter propinsi dan reset', async ({ page }) => {
            const report = new SlaReportPage(page, kind);
            await report.goto();
            await report.verifyPageLoaded();
            await report.filterByProvinceAndReset();
        });

        test('pagination berpindah ke halaman 2', async ({ page }) => {
            const report = new SlaReportPage(page, kind);
            await report.goto();
            await report.verifyPagination();
        });
    });
}

for (const kind of ['propinsi', 'kabupaten', 'direktorat'] as const) {
    test.describe(`Report - Rekap per ${kind}`, () => {
        test.describe.configure({ timeout: 180_000 });

        test('filter dan reset', async ({ page }) => {
            const report = new RekapWilayahPage(page, kind);
            await report.goto();
            await report.verifyPageLoaded();
            await report.filterAndReset();
        });
    });
}
