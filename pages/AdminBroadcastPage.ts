import { expect, Page } from '@playwright/test';

const TIMEOUT = 60_000;

export type BroadcastTarget = 'nasional' | 'propinsi' | 'koordinator' | 'teknisi';

export class AdminBroadcastPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/admin/broadcast');
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Broadcast Pengumuman|Broadcast Announcement/)).toBeVisible({ timeout: TIMEOUT });
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('heading', { name: /Buat Pengumuman Baru|Broadcast Announcement/ })).toBeVisible();
        await expect(this.page.getByRole('combobox').filter({ hasText: /Semua Teknisi|All Technicians/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: /KIRIM PENGUMUMAN MASSAL|Send Notification/ })).toBeDisabled();
    }

    async verifyFormValidationWithoutSending() {
        const title = this.page.getByRole('textbox', { name: /Judul Pengumuman|Message Title/ });
        const message = this.page.getByRole('textbox', { name: /Isi Pesan|Message Content/ });
        const submit = this.page.getByRole('button', { name: /KIRIM PENGUMUMAN MASSAL|Send Notification/ });

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
        const hasPagination = await next.isVisible({ timeout: 3_000 }).catch(() => false);

        if (!hasPagination) {
            await expect(this.page.getByRole('heading', { name: /Buat Pengumuman Baru|Broadcast Announcement/ })).toBeVisible();
            return;
        }

        await expect(previous).toBeVisible();
        if (await next.isEnabled()) {
            await next.click();
            await expect(previous).toBeEnabled({ timeout: TIMEOUT });
        } else {
            await expect(previous).toBeDisabled();
        }
    }

    async sendAnnouncement(target: BroadcastTarget, title: string, message: string) {
        await this.prepareAnnouncement(target, title, message);

        const submit = this.page.getByRole('button', { name: /KIRIM PENGUMUMAN MASSAL|Send Notification/ });
        const responseTimeout = 180_000;
        const response = this.page.waitForResponse((item) =>
            item.request().method() === 'POST' && item.url().includes('/api/admin/')
        , { timeout: responseTimeout });
        this.page.once('dialog', async (dialog) => dialog.accept());
        await submit.click();
        const result = await response;
        const errorBody = result.ok() ? '' : await result.text();
        expect(result.ok(), `HTTP ${result.status()} saat mengirim broadcast: ${errorBody}`).toBeTruthy();
        await expect(this.page.getByRole('textbox', { name: /Judul Pengumuman|Message Title/ }))
            .toHaveValue('', { timeout: responseTimeout });
    }

    async prepareAnnouncement(target: BroadcastTarget, title: string, message: string) {
        await this.selectTarget(target);
        await this.page.getByRole('textbox', { name: /Judul Pengumuman|Message Title/ }).fill(title);
        await this.page.getByRole('textbox', { name: /Isi Pesan|Message Content/ }).fill(message);

        const submit = this.page.getByRole('button', { name: /KIRIM PENGUMUMAN MASSAL|Send Notification/ });
        await expect(submit).toBeEnabled({ timeout: TIMEOUT });
    }

    private async selectTarget(target: BroadcastTarget) {
        if (target === 'nasional') {
            return;
        }

        const targetLabel = {
            propinsi: /Per Propinsi|Per Province|Send to All \(Propinsi\)/,
            koordinator: /Per Tim Koordinator|Per Coordinator Team|Select Coordinator \(Optional\)/,
            teknisi: /Teknisi Spesifik|Specific Technician|Select Technician \(Optional\)/,
        }[target];
        await this.page.getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: targetLabel }).click();

        if (target === 'propinsi') {
            await this.selectProvince();
            return;
        }

        if (target === 'koordinator') {
            await this.selectProvince();
            const coordinator = this.page.getByRole('combobox', { name: /Pilih Koordinator|Choose Coordinator|Coordinator/ });
            await coordinator.fill('ZLP KOORDINATOR');
            await this.page.getByRole('option', {
                name: 'ZLP KOORDINATOR (KD-2026-00000327)',
                exact: true,
            }).click();
            return;
        }

        await this.selectProvince();
        const coordinator = this.page.getByRole('combobox', { name: /Pilih Koordinator|Choose Coordinator|Select Coordinator|Coordinator/ });
        if (await coordinator.isVisible().catch(() => false)) {
            await coordinator.fill('ZLP KOORDINATOR');
            await this.page.getByRole('option', {
                name: 'ZLP KOORDINATOR (KD-2026-00000327)',
                exact: true,
            }).click();
        }
        const technician = this.page.getByRole('combobox', { name: /Cari & Pilih Teknisi|Search & Select Technician|Technician/ });
        await technician.fill('ZLP TEKNISI 2');
        await this.page.getByRole('option', {
            name: 'ZLP TEKNISI 2 (TEK-2026-00091297) - Prov. D.K.I. Jakarta',
            exact: true,
        }).click();
    }

    private async selectProvince() {
        const province = this.page.getByRole('combobox').filter({ hasText: /All Provinces|Semua Propinsi/ });
        await province.click();
        await this.page.getByRole('option', { name: 'Prov. D.K.I. Jakarta', exact: true }).click();
    }
}
