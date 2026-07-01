import { Page, expect } from '@playwright/test';

export class AlokasiPage {

    private selectedStatusProgress: string | null = null;
    private selectedPayment: string | null = null;

    constructor(private page: Page) {}

    private label(name: string) {
        const labels: Record<string, RegExp> = {
            'ID Transaksi': /^(ID Transaksi|Transaction ID)$/,
            'Nama Instansi': /^(Nama Instansi|School Name)$/,
            'SN Terisi': /^(SN Terisi|SN Filled)$/,
            'SN Kosong': /^(SN Kosong|SN Empty)$/,
            'Cari Alokasi': /^(Cari Alokasi|Search)$/,
            Excel: /^(Excel|Export Excel)$/,
            CSV: /^(CSV|Export CSV)$/,
        };

        return labels[name] ?? new RegExp(`^${name}$`);
    }

    private textbox(name: string) {
        return this.page.getByRole('textbox', { name: this.label(name) });
    }

    private checkbox(name: string) {
        return this.page.getByRole('checkbox', { name: this.label(name) });
    }

    private button(name: string) {
        return this.page.getByRole('button', { name: this.label(name) });
    }

    // ─── Navigation ──────────────────────────────────────────────

    async goto() {
        await this.page.goto('/monitoring/list_alokasi');
    }

    // ─── Core Checks ─────────────────────────────────────────────

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/list_alokasi/);
        await expect(this.page.getByRole('main')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit' }).first()).toBeVisible({ timeout: 30_000 });
        await expect(
            this.page.getByRole('navigation', { name: 'breadcrumb' })
                .getByText(/Daftar Alokasi|Allocation Monitoring/)
        ).toBeVisible();
    }

    // ─── Filter Section ───────────────────────────────────────────

    async verifyFilterSection() {
        await expect(
            this.textbox('ID Transaksi')
        ).toBeVisible();

        await expect(
            this.textbox('NPSN')
        ).toBeVisible();

        await expect(
            this.textbox('Nama Instansi')
        ).toBeVisible();

        await expect(
            this.textbox('AWB')
        ).toBeVisible();

        await expect(
            this.textbox('Serial Number')
        ).toBeVisible();
    }

async verifyDropdowns() {
    const dropdowns = [
        /Semua Status Progress|All Status/,
        /Semua Pembayaran|Payment Status/,
        /Semua Jenjang|Select Level/,
        /Semua Direktorat|Select Directorate/,
        /Semua Partner|All Partners/,
        /Semua Propinsi|Select Province/,
        /Semua Kabupaten Kota|Select Regency/,
        /Semua Kecamatan|Select District/,
        /Semua Kelurahan|Select Subdistrict/,
    ];
    for (const dropdown of dropdowns) {
        await expect(
            this.page.getByRole('combobox').filter({ hasText: dropdown })
        ).toBeVisible();
    }
}

    async verifyCheckboxes() {
        await expect(
            this.checkbox('SN Terisi')
        ).toBeVisible();

        await expect(
            this.checkbox('SN Kosong')
        ).toBeVisible();
    }

    async verifyActionButtons() {
        await expect(
            this.button('Cari Alokasi')
        ).toBeVisible();

        await expect(
            this.button('Reset')
        ).toBeVisible();

        await expect(
            this.button('Excel')
        ).toBeVisible();

        await expect(
            this.button('CSV')
        ).toBeVisible();
    }

    // ─── Table ────────────────────────────────────────────────────

    async verifyTableColumns() {
        const headers = [
            /Aksi|Actions/,
            /ID Transaksi|Transaction ID/,
            'Status',
            /Pembayaran|Payment Status/,
            'NPSN',
            /Propinsi|Province/,
            /Kabupaten|Regency \/ City/,
            /Nama Instansi|School Name/,
        ];

        for (const header of headers) {
            await expect(this.page.locator('body')).toContainText(header);
        }
    }


    // ─── Filter Actions ───────────────────────────────────────────

    async fillIdTransaksi(value: string) {
        const input = this.textbox('ID Transaksi');
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async fillNpsn(value: string) {
        const input = this.textbox('NPSN');
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async fillNamaInstansi(value: string) {
        const input = this.textbox('Nama Instansi');
        await input.fill(value);
        await input.blur();
        await expect(input).toHaveValue(value);
    }

    async selectStatusProgress(value: string) {
        await this.page.getByRole('combobox').filter({ hasText: /Semua Status Progress|All Status/ }).click();
        await this.page.getByRole('option', { name: value }).click();
        this.selectedStatusProgress = value;
    }

    async selectPembayaran(value: string) {
        await this.page
            .getByRole('combobox')
            .filter({ hasText: /Semua Pembayaran|Payment Status/ })
            .click();

        await this.page
            .locator(`[role="option"][data-value="${value}"]`)
            .click();
        this.selectedPayment = value;
    }

async clickCariAlokasi() {
    const idTransaksi = await this.textbox('ID Transaksi').inputValue().catch(() => '');
    const expectsSpecificTransaction = Boolean(idTransaksi);

    for (let attempt = 1; attempt <= 4; attempt += 1) {
        if (attempt > 1) {
            await this.page.reload();
            await expect(this.textbox('ID Transaksi')).toBeVisible({ timeout: 30_000 });
            if (idTransaksi) {
                await this.textbox('ID Transaksi').fill(idTransaksi);
                await this.textbox('ID Transaksi').blur();
                await expect(this.textbox('ID Transaksi')).toHaveValue(idTransaksi);
            }
        }

        const response = this.waitForAlokasiResponse((url) => {
            if (!idTransaksi) return true;
            return url.searchParams.get('id_transaksi') === idTransaksi;
        });

        await this.clickSearchButton();

        const result = await response;
        if (!result) {
            if (!expectsSpecificTransaction &&
                await this.getDataRows().first().or(this.emptyState()).isVisible({ timeout: 10_000 }).catch(() => false)) {
                return;
            }
            continue;
        }

        expect(result.ok(), `HTTP ${result.status()} saat mencari alokasi`).toBeTruthy();

        const body = await result.json().catch(() => null);
        const rows = body?.data?.data;

        if (Array.isArray(rows) && rows.length === 0) {
            await this.waitForEmptyTable();
            return;
        }

        if (expectsSpecificTransaction && Array.isArray(rows)) {
            const matchesFilter = rows.every((row) => row?.id_transaksi === idTransaksi);
            if (!matchesFilter) {
                continue;
            }

            await expect(this.page.getByText(idTransaksi, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
            return;
        }

        await expect(this.getDataRows().first().or(this.emptyState())).toBeVisible({ timeout: 30_000 });
        return;
    }

    if (expectsSpecificTransaction) {
        throw new Error(`Search alokasi untuk ID Transaksi ${idTransaksi} tidak menghasilkan response/filter yang konsisten.`);
    }

    await expect(this.getDataRows().first().or(this.emptyState())).toBeVisible({ timeout: 60_000 });
}

async clickReset() {
    await this.button('Reset').click();
}

    async verifyInputIsEmpty(name: string) {
    await expect(
        this.textbox(name)
    ).toHaveValue('');
    }

// ─── Row Actions ──────────────────────────────────────────────

    private getDataRows() {
        return this.page.getByRole('button', { name: 'Edit' });
    }

    async verifyTableHasRows() {
        await expect(this.getDataRows().first()).toBeVisible();
    }

    async verifyTableIsEmpty() {
        await this.waitForEmptyTable();
    }

    async verifyPaymentFilterResult(value: string) {
        const firstRow = this.getDataRows().first();
        await expect(firstRow.or(this.emptyState())).toBeVisible({ timeout: 60_000 });

        if (await firstRow.isVisible().catch(() => false)) {
            await expect(this.page.getByText(value, { exact: true }).first()).toBeVisible();
        }
    }

    async getIdTransaksiOnRow(index: number): Promise<string> {
        const idLocator = this.page
            .locator('p.css-f2u90h')
            .nth(index);

        await expect(idLocator).toBeVisible();

        return (await idLocator.textContent())?.trim() ?? '';
    }

    async clickViewOnRow(index: number) {
        await this.getDataRows().nth(index).click();
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }

    private waitForAlokasiResponse(extra: (url: URL) => boolean = () => true) {
        return this.page.waitForResponse((item) => {
            if (item.request().method() !== 'GET' || !item.url().includes('/api/')) return false;

            const url = new URL(item.url());
            return url.pathname.includes('/api/transaksi/alokasi') && extra(url);
        }, { timeout: 20_000 }).catch(() => null);
    }

    private async clickSearchButton() {
        const search = this.button('Cari Alokasi');
        await expect(search).toBeEnabled({ timeout: 30_000 });

        try {
            await search.click({ timeout: 5_000 });
            return;
        } catch {
            // MUI can keep the button/layout unstable while the grid is repainting.
        }

        await search.dispatchEvent('click');
    }

    private async waitForEmptyTable() {
        await expect(this.emptyState()).toBeVisible({ timeout: 30_000 });
        await expect(this.getDataRows().first()).toBeHidden({ timeout: 30_000 });
    }
}
