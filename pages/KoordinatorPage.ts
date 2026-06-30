import { expect, Page, Response } from '@playwright/test';

export interface CoordinatorData {
    name: string;
    phone: string;
    province: string;
}

export interface CoordinatorRowData {
    code: string;
    name: string;
    phone: string;
    province: string;
    regency: string;
}

export class KoordinatorPage {
    private authorization?: string;
    private apiOrigin?: string;

    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/master/koordinator');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/master\/koordinator(?:\?|$)/);
        await expect(
            this.page
                .getByRole('navigation', { name: 'breadcrumb' })
                .getByText(/Koordinator|Coordinator/)
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'add', exact: true })).toBeVisible();
    }

    async verifyFilterSection() {
        await expect(this.codeInput()).toBeVisible();
        await expect(this.nameInput()).toBeVisible();
        await expect(this.phoneInput()).toBeVisible();

        await expect(this.provinceFilter()).toBeVisible();
        await expect(this.regencyFilter()).toBeVisible();
        await expect(this.regencyFilter()).toBeDisabled();

        for (const name of [/Cari Koordinator|Search Coordinator/, /Reset/, /Export Excel/]) {
            await expect(this.page.getByRole('button', { name })).toBeVisible();
        }
    }

    async filterByCode(code: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.codeInput().fill(code);
        await this.search();
    }

    async filterByName(name: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.nameInput().fill(name);
        await this.search();
    }

    async filterByPhone(phone: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.phoneInput().fill(phone);
        await this.search();
    }

    async filterByProvince(province: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.selectOption(this.provinceFilter(), province);
        await this.search();
    }

    async filterByRegency(province: string, regency: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.selectOption(this.provinceFilter(), province);
        await expect(this.regencyFilter()).toBeEnabled();
        await this.selectOption(this.regencyFilter(), regency);
        await this.search();
    }

    async filterByFirstAvailableRegency(province: string): Promise<string> {
        await this.ensureListPage();
        await this.resetFilters();
        await this.selectOption(this.provinceFilter(), province);
        await expect(this.regencyFilter()).toBeEnabled();
        await this.regencyFilter().click();

        const options = this.page.getByRole('option');
        await expect(options.first()).toBeVisible();

        let selectedRegency = '';
        for (let index = 0; index < await options.count(); index += 1) {
            const option = options.nth(index);
            const text = (await option.textContent())?.trim() ?? '';
            if (text && !/semua kabupaten/i.test(text)) {
                selectedRegency = text;
                await option.click();
                break;
            }
        }

        expect(selectedRegency, 'Tidak ada opsi Kabupaten/Kota').toBeTruthy();
        await this.search();
        return selectedRegency;
    }

    async expectCoordinatorVisible(value: string) {
        await this.waitForCoordinatorReady();
        await expect(this.page.getByText(value, { exact: true })).toBeVisible({ timeout: 30_000 });
        await expect(this.dataRows().first()).toBeVisible({ timeout: 30_000 });
    }

    async expectTableHasData() {
        await this.waitForCoordinatorReady();
        await expect(this.dataRows().first()).toBeVisible({ timeout: 30_000 });
    }

    async getCoordinatorDataOnRow(index: number): Promise<CoordinatorRowData> {
        await this.ensureListPage();
        await this.resetFilters();

        await this.waitForCoordinatorReady();

        const editButton = this.dataRows().nth(index);
        await expect(editButton).toBeVisible({ timeout: 30_000 });

        const row = editButton.locator('xpath=../../..');
        const columns = (await row.locator(':scope > *').allTextContents())
            .map((item) => item.trim())
            .filter(Boolean);
        expect(columns.length, 'Struktur kolom koordinator berubah').toBeGreaterThanOrEqual(4);

        const codeIndex = columns.findIndex((item) => /^KD-\d{4}-\d+$/.test(item));
        const code = columns[codeIndex] ?? '';
        const name = columns[codeIndex + 1] ?? '';
        const phone = columns.find((item) => /^\+?\d{8,}$/.test(item)) ?? '';
        const province = columns.find((item) => /^Prov\./.test(item)) ?? 'Prov. Aceh';
        const provinceIndex = columns.indexOf(province);

        return {
            code,
            name,
            phone,
            province: province.replace(/\+\d+\s*\.\.\.$/, '').trim(),
            regency: provinceIndex >= 0 ? (columns[provinceIndex + 1] ?? '') : '',
        };
    }

    async expectNoData() {
        await this.waitForCoordinatorReady();
        await expect(this.emptyState()).toBeVisible({ timeout: 30_000 });
    }

    async resetFilters() {
        const reset = this.page.getByRole('button', { name: 'Reset', exact: true });
        if (!await reset.isVisible()) {
            return;
        }

        const responsePromise = this.waitForCoordinatorResponse(false);
        await reset.click();
        await this.captureApi(await responsePromise);
        await this.waitForCoordinatorReady();
    }

    async expectFiltersReset() {
        await expect(this.codeInput()).toHaveValue('');
        await expect(this.nameInput()).toHaveValue('');
        await expect(this.phoneInput()).toHaveValue('');
        await expect(this.provinceFilter()).toContainText(/Semua Propinsi|All Provinces/);
        await expect(this.regencyFilter()).toContainText(/Semua Kabupaten\/Kota|All Regencies/);
        await expect(this.regencyFilter()).toBeDisabled();
    }

    async verifyPagination() {
        const pageSize = this.page.getByRole('combobox', { name: /Baris per halaman:|Rows per page/ });
        await pageSize.click();
        await this.page.getByRole('option', { name: '10', exact: true }).click();

        const previous = this.page.getByRole('button', { name: 'Go to previous page' });
        const next = this.page.getByRole('button', { name: 'Go to next page' });
        await expect(previous).toBeDisabled();
        await expect(next).toBeEnabled();

        await next.click();
        await expect(this.page.getByText(/11[–-]20 of \d+/)).toBeVisible();
        await expect(previous).toBeEnabled();

        await previous.click();
        await expect(this.page.getByText(/1[–-]10 of \d+/)).toBeVisible();
    }

    async openAddCoordinator() {
        await this.page.getByRole('button', { name: 'add', exact: true }).click();
        await expect(this.page).toHaveURL(/\/master\/detail_koordinator/);
        await expect(this.page.getByRole('tab', { name: /Profil Koordinator|Coordinator Profile|Profile/ })).toBeVisible();
    }

    async addCoordinator(data: CoordinatorData) {
        await this.page.getByRole('textbox', { name: /Nama Koordinator|Coordinator Name|Technician Name/ }).fill(data.name);
        await this.page.getByRole('textbox', { name: /Phone 1|Phone Number 1/ }).fill(data.phone);
        await this.selectProvinceArea(data.province);

        await this.page.getByRole('button', { name: /Simpan Koordinator|Save Coordinator/ }).click();
        await expect(this.page).toHaveURL(/\/master\/detail_koordinator\/KD-\d{4}-\d+$/);
    }

    async getVisibleCoordinatorCode(): Promise<string> {
        const code = this.page.getByText(/^KD-\d{4}-\d+$/).first();
        await expect(code).toBeVisible();
        return (await code.textContent())?.trim() ?? '';
    }

    async deleteCoordinatorByCode(code: string) {
        if (!this.authorization || !this.apiOrigin) {
            await this.filterByCode(code);
        }

        expect(this.authorization, 'Authorization API tidak ditemukan').toBeTruthy();
        expect(this.apiOrigin, 'Origin API tidak ditemukan').toBeTruthy();

        const response = await this.page.request.delete(
            `${this.apiOrigin}/api/reference/koordinator/${encodeURIComponent(code)}`,
            { headers: { authorization: this.authorization! } }
        );
        expect(response.ok(), `Delete koordinator gagal: HTTP ${response.status()}`).toBeTruthy();
    }

    async deleteCoordinatorByNameIfExists(name: string): Promise<boolean> {
        await this.goto();
        await this.verifyPageLoaded();
        await this.filterByName(name);

        if (await this.emptyState().isVisible()) {
            return false;
        }

        const code = await this.getVisibleCoordinatorCode();
        await this.deleteCoordinatorByCode(code);
        return true;
    }

    async expectCoordinatorDeleted(code: string) {
        await this.filterByCode(code);
        await expect(this.page.getByText(code, { exact: true })).not.toBeVisible();
        await expect(this.emptyState()).toBeVisible();
    }

    private async search() {
        await this.retryCoordinatorAction(async () => {
            const responsePromise = this.waitForCoordinatorResponse(true);
            await this.page.getByRole('button', { name: /Cari Koordinator|Search Coordinator/ }).click();
            await this.captureApi(await responsePromise);
            await this.waitForCoordinatorReady();
        });
    }

    private async ensureListPage() {
        if (!/\/master\/koordinator(?:\?|$)/.test(this.page.url())) {
            await this.goto();
            await this.verifyPageLoaded();
        }
    }

    private async selectProvinceArea(province: string) {
        await this.page.getByRole('button', { name: /Pilih Propinsi|Select Province/ }).click();
        const dialog = this.page.getByRole('dialog', { name: /Pilih Propinsi Area|Select Province Area|Select Province/ });
        await expect(dialog.getByRole('progressbar')).toBeHidden();
        await dialog.getByRole('checkbox', { name: province, exact: true }).check();
        await dialog.getByRole('button', { name: /Terapkan|Apply|common\.apply/ }).click();
        await expect(dialog).toBeHidden();
    }

    private async selectOption(combobox: ReturnType<Page['getByRole']>, option: string) {
        await combobox.click();
        await this.page.getByRole('option', { name: option, exact: true }).click();
    }

    private provinceFilter() {
        return this.page.getByRole('combobox').filter({ hasText: /Semua Propinsi|All Provinces/ });
    }

    private regencyFilter() {
        return this.page.getByRole('combobox').filter({ hasText: /Semua Kabupaten\/Kota|All Regencies/ });
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }

    private waitForCoordinatorResponse(search: boolean) {
        return this.page.waitForResponse((response) =>
            response.url().includes('/api/reference/koordinator?') &&
            response.url().includes(`search=${search}`) &&
            response.request().method() === 'GET'
        , { timeout: 30_000 }).catch(() => null);
    }

    private async captureApi(response: Response | null) {
        if (!response) {
            return;
        }

        this.authorization = response.request().headers()['authorization'];
        this.apiOrigin = new URL(response.url()).origin;
    }

    private async retryCoordinatorAction(action: () => Promise<void>, attempts = 3) {
        let lastError: unknown;

        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            try {
                await action();
                return;
            } catch (error) {
                lastError = error;
                if (attempt === attempts) break;

                await this.goto();
                await this.verifyPageLoaded();
                await this.waitForCoordinatorReady().catch(() => undefined);
            }
        }

        throw lastError;
    }

    private async waitForCoordinatorReady(timeout = 45_000) {
        const loading = this.page.getByText(/^(Loading data\.\.\.|Memuat data\.\.\.)$/);
        if (await loading.isVisible().catch(() => false)) {
            await expect(loading).toBeHidden({ timeout });
        }

        await expect(this.dataRows().first().or(this.emptyState())).toBeVisible({ timeout });
    }

    private dataRows() {
        return this.page.getByRole('button', { name: 'Edit' });
    }

    private codeInput() {
        return this.page.getByRole('textbox', { name: /Kode Koordinator|Coordinator Code|Technician Code/ });
    }

    private nameInput() {
        return this.page.getByRole('textbox', { name: /Nama Koordinator|Coordinator Name|Technician Name/ });
    }

    private phoneInput() {
        return this.page.getByRole('textbox', { name: /No Telepon|Phone Number|Phone/ });
    }
}
