import { expect, Page } from '@playwright/test';

export interface SchoolAllocation {
    npsn: string;
    nama_sekolah: string;
    current_units: number;
}

export class CreateAlokasiPage {
    private readonly fallbackNpsns = ['P9959706', '70036425', '69918390', '20361190', '70001584'];

    constructor(private readonly page: Page) {}

    private label(name: string) {
        const labels: Record<string, RegExp> = {
            'Nama Sekolah': /^(Nama Sekolah|School Name)$/,
            Propinsi: /Propinsi|Province/,
            Kabupaten: /Kabupaten|Regency/,
            'Min Alokasi': /^(Min Alokasi|Min Allocation)$/,
            'Max Alokasi': /^(Max Alokasi|Max Allocation)$/,
            Cari: /^(Cari|Search)$/,
            'Tambah Alokasi': /Tambah Alokasi|Add Allocation/,
            'Input Alokasi Unit': /Input Alokasi Unit|Allocation Unit Input|Input Unit Allocation/,
            'Jumlah Per Sekolah': /Jumlah Per Sekolah|Amount Per School|Quantity Per School/,
            Simpan: /^(Simpan|Save)$/,
            Batal: /^(Batal|Cancel)$/,
        };

        return labels[name] ?? new RegExp(`^${name}$`);
    }

    private button(name: string) {
        return this.page.getByRole('button', { name: this.label(name) });
    }

    async goto(): Promise<SchoolAllocation> {
        const data = this.waitForAllocationResponse();
        await this.page.goto('/transaksi/create_alokasi');
        await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toBeVisible({ timeout: 60_000 });

        const response = await data;
        if (response) {
            const body = await response.json();
            const first = body?.data?.data?.[0];
            if (first) {
                await this.ensureSchoolVisible(first.npsn);
                return first as SchoolAllocation;
            }
        }

        if (!(await this.hasVisibleRows())) {
            return this.findFallbackSchool();
        }

        return this.firstVisibleSchool();
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/create_alokasi/);
        await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toBeVisible();
        await expect(this.button('Cari')).toBeVisible();
        await expect(this.button('Tambah Alokasi')).toBeDisabled();
    }

    async verifyFilters() {
        await expect(this.page.getByRole('textbox', { name: this.label('Nama Sekolah') })).toBeVisible();
        await expect(this.page.getByRole('combobox', { name: this.label('Propinsi') })).toBeVisible();
        await expect(this.page.getByRole('combobox', { name: this.label('Kabupaten') })).toBeVisible();
        await expect(this.page.getByRole('spinbutton', { name: this.label('Min Alokasi') })).toBeVisible();
        await expect(this.page.getByRole('spinbutton', { name: this.label('Max Alokasi') })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset', exact: true })).toBeVisible();
    }

    async searchByNpsn(npsn: string) {
        await this.searchByNpsnWithRetry(npsn);
    }

    async reset() {
        await this.page.getByRole('button', { name: 'Reset', exact: true }).click();
        await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toHaveValue('');
    }

    async goToNextPage() {
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        await expect(next).toBeVisible();

        if (!(await next.isEnabled())) {
            await expect(this.page.getByText(/(\d+|0).?[–-].?(\d+|0) of \d+/)).toBeVisible();
            return;
        }

        await next.click();
        await expect(this.page.getByText(/26.?50 of/)).toBeVisible({ timeout: 60_000 });
    }

    async selectFirstSchool() {
        if (!(await this.hasVisibleRows())) {
            await this.findFallbackSchool();
        }

        await this.dataCheckboxes().first().check();
        await expect(this.button('Tambah Alokasi')).toBeEnabled();
    }

    async openAddDialog() {
        await this.button('Tambah Alokasi').click();
        const dialog = this.page.getByRole('dialog', { name: this.label('Input Alokasi Unit') });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('spinbutton', { name: this.label('Jumlah Per Sekolah') })).toHaveValue('1');
        return dialog;
    }

    async submitAllocation(count = 1) {
        const dialog = this.page.getByRole('dialog', { name: this.label('Input Alokasi Unit') });
        await dialog.getByRole('spinbutton', { name: this.label('Jumlah Per Sekolah') }).fill(String(count));
        const response = this.page.waitForResponse((item) =>
            item.url().includes('/api/transaksi/bulk_create_alokasi') &&
            item.request().method() === 'POST'
        );
        await dialog.getByRole('button', { name: this.label('Simpan') }).click();
        const result = await response;
        const text = await result.text();
        expect(result.ok(), text).toBeTruthy();
        await expect(dialog).toBeHidden();
        return text ? JSON.parse(text) : null;
    }

    private dataCheckboxes() {
        return this.page.getByRole('checkbox').nth(1);
    }

    private waitForAllocationResponse() {
        return this.page.waitForResponse((response) =>
            response.url().includes('/api/reference/sekolah_alokasi_count') &&
            response.ok()
        , { timeout: 30_000 }).catch(() => null);
    }

    private async hasVisibleRows() {
        return this.dataCheckboxes().isVisible().catch(() => false);
    }

    private async ensureSchoolVisible(npsn: string) {
        if (await this.page.getByText(npsn, { exact: true }).first().isVisible().catch(() => false)) {
            return;
        }

        await this.searchByNpsnWithRetry(npsn);
    }

    private async searchByNpsnWithRetry(npsn: string) {
        const input = this.page.getByRole('textbox', { name: 'NPSN' });

        for (let attempt = 1; attempt <= 3; attempt++) {
            await expect(input).toBeVisible({ timeout: 30_000 });
            await input.fill(npsn);
            const response = this.page.waitForResponse((item) =>
                item.url().includes('/api/reference/sekolah_alokasi_count') &&
                item.url().includes(`npsn=${encodeURIComponent(npsn)}`) &&
                item.ok()
            , { timeout: 30_000 }).catch(() => null);

            await this.clickSearchButton();
            await response;

            const npsnCell = this.page.getByText(npsn, { exact: true }).first();
            if (await npsnCell.isVisible({ timeout: 10_000 }).catch(() => false)) {
                await expect(this.dataCheckboxes()).toBeVisible({ timeout: 10_000 });
                return;
            }

            await this.page.waitForTimeout(1_500);
            if (attempt < 3) {
                await this.page.reload();
                await expect(this.page.getByRole('textbox', { name: 'NPSN' })).toBeVisible({ timeout: 60_000 });
            }
        }

        throw new Error(`Data sekolah dengan NPSN ${npsn} tidak muncul setelah retry pencarian.`);
    }

    private async clickSearchButton() {
        const search = this.button('Cari');
        await expect(search).toBeEnabled({ timeout: 30_000 });

        try {
            await search.click({ timeout: 5_000 });
            return;
        } catch {
            // MUI table repaint can keep the button from becoming "stable" for Playwright.
            // Dispatching a click still exercises the same app handler without waiting for layout stability forever.
        }

        try {
            await search.dispatchEvent('click');
            return;
        } catch {
            await this.page.getByRole('textbox', { name: 'NPSN' }).press('Enter');
        }
    }

    private async findFallbackSchool(): Promise<SchoolAllocation> {
        for (const npsn of this.fallbackNpsns) {
            try {
                await this.searchByNpsnWithRetry(npsn);
                return this.firstVisibleSchool();
            } catch {
                // Try the next known NPSN when this environment has no matching row.
            }
        }

        throw new Error('Halaman Buat Alokasi tidak menampilkan data sekolah setelah default load dan fallback search.');
    }

    private async firstVisibleSchool(): Promise<SchoolAllocation> {
        const npsn = await this.firstVisibleNpsn();
        const schoolName = (await this.page.locator('main p').nth(1).textContent())?.trim() ?? '';
        return {
            npsn,
            nama_sekolah: schoolName,
            current_units: 0,
        };
    }

    private async firstVisibleNpsn() {
        const npsn = this.page.locator('main p').filter({ hasText: /^(\d{8}|P\d+)$/ }).first();
        await expect(npsn).toBeVisible({ timeout: 60_000 });
        return (await npsn.textContent())?.trim() ?? '';
    }
}
