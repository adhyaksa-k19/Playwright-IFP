import { test } from '@playwright/test';
import { AdminSlaRulesPage, SlaRuleData } from '../pages/AdminSlaRulesPage';

test.describe.serial('Administrasi - Konfigurasi SLA', () => {
    test.describe.configure({ timeout: 120_000 });

    const rule: SlaRuleData = {
        province: 'Prov. Aceh',
        lowerBound: '-99999',
        upperBound: '6',
        score: '3',
    };

    test('layout halaman tersedia', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.verifyPageLoaded();
    });

    test('filter tanpa hasil dan reset', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.filterWithoutResultAndReset();
    });

    test('pagination berpindah halaman', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.verifyPagination();
    });

    test('hapus SLA rule', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.verifyDeleteRuleConfirmation(rule);
    });

    test('add SLA rule', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.verifyAddRuleForm(rule);
    });

    test('edit SLA rule', async ({ page }) => {
        const admin = new AdminSlaRulesPage(page);
        await admin.goto();
        await admin.verifyEditRuleForm(rule, '4');
    });
});
