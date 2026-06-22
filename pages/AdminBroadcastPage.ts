import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export type BroadcastTarget = 'nasional' | 'propinsi' | 'koordinator' | 'teknisi';

export class AdminBroadcastPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/broadcast');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Broadcast Pengumuman', { exact: true })).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: 'Buat Pengumuman Baru' })).toBeVisible();
        await expect(this.page.getByRole('combobox').filter({ hasText: 'Semua Teknisi' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'KIRIM PENGUMUMAN MASSAL' })).toBeDisabled();
        await expect(this.page.getByRole('button', { name: 'Resend' }).first()).toBeVisible();
    }

    async verifyFormValidationWithoutSending() {
        const title = this.page.getByRole('textbox', { name: 'Judul Pengumuman' });
        const message = this.page.getByRole('textbox', { name: 'Isi Pesan' });
        const submit = this.page.getByRole('button', { name: 'KIRIM PENGUMUMAN MASSAL' });

        await title.fill('TEST VALIDASI OTOMASI');
        await expect(submit).toBeDisabled();
        await message.fill('Pesan hanya untuk menguji validasi form dan tidak dikirim.');
        await expect(submit).toBeEnabled();

        await title.clear();
        await message.clear();
        await expect(submit).toBeDisabled();
    }

    async verifyPagination() {
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        await expect(next).toBeEnabled({ timeout: TIMEOUT });
        await next.click();
        await expect(previous).toBeEnabled({ timeout: TIMEOUT });
    }

    async sendAnnouncement(target: BroadcastTarget, title: string, message: string) {
        await this.selectTarget(target);
        await this.page.getByRole('textbox', { name: 'Judul Pengumuman' }).fill(title);
        await this.page.getByRole('textbox', { name: 'Isi Pesan' }).fill(message);

        const submit = this.page.getByRole('button', { name: 'KIRIM PENGUMUMAN MASSAL' });
        await expect(submit).toBeEnabled({ timeout: TIMEOUT });
        const responseTimeout = 180_000;
        const response = this.page.waitForResponse((item) =>
            item.request().method() === 'POST' && item.url().includes('/api/admin/')
        , { timeout: responseTimeout });
        this.page.once('dialog', async (dialog) => dialog.accept());
        await submit.click();
        const result = await response;
        const errorBody = result.ok() ? '' : await result.text();
        expect(result.ok(), `HTTP ${result.status()} saat mengirim broadcast: ${errorBody}`).toBeTruthy();
        await expect(this.page.getByRole('textbox', { name: 'Judul Pengumuman' }))
            .toHaveValue('', { timeout: responseTimeout });
    }

    private async selectTarget(target: BroadcastTarget) {
        if (target === 'nasional') {
            return;
        }

        const targetLabel = {
            propinsi: 'Per Propinsi',
            koordinator: 'Per Tim Koordinator',
            teknisi: 'Teknisi Spesifik',
        }[target];
        await this.page.getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: targetLabel, exact: true }).click();

        if (target === 'propinsi') {
            await this.page.getByRole('combobox').nth(1).click();
            await this.page.getByRole('option', { name: 'Prov. D.K.I. Jakarta', exact: true }).click();
            return;
        }

        if (target === 'koordinator') {
            const coordinator = this.page.getByRole('combobox', { name: 'Pilih Koordinator' });
            await coordinator.fill('ZLP KOORDINATOR');
            await this.page.getByRole('option', {
                name: 'ZLP KOORDINATOR (KD-2026-00000327)',
                exact: true,
            }).click();
            return;
        }

        const technician = this.page.getByRole('combobox', { name: 'Cari & Pilih Teknisi *' });
        await technician.fill('ZLP TEKNISI 2');
        await this.page.getByRole('option', {
            name: 'ZLP TEKNISI 2 (TEK-2026-00091297) - Prov. D.K.I. Jakarta',
            exact: true,
        }).click();
    }
}
