import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Dashboard', () => {

    let dashboard: DashboardPage;

    test.beforeEach(async ({ page }) => {
        dashboard = new DashboardPage(page);
        await dashboard.goto();
        await dashboard.verifyDashboardLoaded();
    });

    test('Dashboard Full Validation', async ({ page }) => {
        await dashboard.verifySidebarMenu();
        await dashboard.verifySummaryCards();
        await dashboard.verifyStatusCards();
        await dashboard.verifyCharts();
        await dashboard.verifyFilterCoordinator();
    });

    test('Sidebar - All menus visible', async ({ page }) => {
        await dashboard.verifySidebarMenu();
    });

    test('Summary Cards - All cards visible', async ({ page }) => {
        await dashboard.verifySummaryCards();
    });

    test('Summary Cards - Count values are numeric', async ({ page }) => {
        const cardNames = [
            'Total Alokasi',
            'Barang Siap',
            'Proses Pengiriman',
        ];

        for (const cardName of cardNames) {
            const text = await dashboard.getSummaryCardCount(cardName);
            // Strip out label text, check remaining content has a number
            expect(text).toMatch(/\d+/);
        }
    });

    test('Status Cards - All statuses visible', async ({ page }) => {
        await dashboard.verifyStatusCards();
    });

    test('Charts - Proporsi and Progress sections visible', async ({ page }) => {
        await dashboard.verifyCharts();
    });

    test('Filter Koordinator - Section is visible', async ({ page }) => {
        await dashboard.verifyFilterCoordinator();
    });

    test('Page Title is correct', async ({ page }) => {
        await expect(page).toHaveTitle(/IFP|Dashboard/i);
    });

});
