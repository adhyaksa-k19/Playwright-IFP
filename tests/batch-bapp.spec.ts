import { test } from '@playwright/test';
import { BatchBappPage } from '../pages/BatchBappPage';

test.describe('Transaksi - Pengiriman Batch BAPP', () => {
    let batch: BatchBappPage;

    test.beforeEach(async ({ page }) => {
        batch = new BatchBappPage(page);
        await batch.goto();
        await batch.verifyPageLoaded();
    });

    test('menampilkan action dan kolom daftar batch', async () => {
        await batch.verifyTable();
    });

    test('membuka detail batch pertama', async () => {
        await batch.openFirstDetail();
    });

    test('membuat batch baru dengan status DRAFT', async () => {
        const batchNumber = `E2E-BATCH-${Date.now()}`;
        await batch.createDraftBatch(
            batchNumber,
            'Batch draft dibuat otomatis oleh Playwright'
        );
    });

    test('kontrol pagination batch berfungsi sesuai jumlah data', async () => {
        await batch.verifyPagination();
    });
});
