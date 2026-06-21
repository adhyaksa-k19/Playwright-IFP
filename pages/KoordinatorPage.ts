import { expect, Page } from '@playwright/test';

export interface CoordinatorData {
    name: string;
    phone: string;
    province: string;
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
                .getByText('Koordinator', { exact: true })
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'add', exact: true })).toBeVisible();
    }

    async verifyFilterSection() {
        for (const name of ['Kode Koordinator', 'Nama Koordinator', 'No Telepon']) {
            await expect(this.page.getByRole('textbox', { name, exact: true })).toBeVisible();
        }

        await expect(this.provinceFilter()).toBeVisible();
        await expect(this.regencyFilter()).toBeVisible();
        await expect(this.regencyFilter()).toBeDisabled();

        for (const name of ['Cari Koordinator', 'Reset', 'Export Excel']) {
            await expect(this.page.getByRole('button', { name, exact: true })).toBeVisible();
        }
    }

    async filterByCode(code: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.page.getByRole('textbox', { name: 'Kode Koordinator' }).fill(code);
        await this.search();
    }

    async filterByName(name: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.page.getByRole('textbox', { name: 'Nama Koordinator' }).fill(name);
        await this.search();
    }

    async filterByPhone(phone: string) {
        await this.ensureListPage();
        await this.resetFilters();
        await this.page.getByRole('textbox', { name: 'No Telepon' }).fill(phone);
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

    async expectCoordinatorVisible(value: string) {
        await expect(this.page.getByText(value, { exact: true })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
    }

    async expectTableHasData() {
        await expect(this.page.getByRole('button', { name: 'Edit' }).first()).toBeVisible();
    }

    async expectNoData() {
        await expect(this.emptyState()).toBeVisible();
    }

    async resetFilters() {
        const reset = this.page.getByRole('button', { name: 'Reset', exact: true });
        if (!await reset.isVisible()) {
            return;
        }

        const responsePromise = this.waitForCoordinatorResponse(false);
        await reset.click();
        await this.captureApi(await responsePromise);
    }

    async expectFiltersReset() {
        for (const name of ['Kode Koordinator', 'Nama Koordinator', 'No Telepon']) {
            await expect(this.page.getByRole('textbox', { name, exact: true })).toHaveValue('');
        }
        await expect(this.provinceFilter()).toContainText('Semua Propinsi');
        await expect(this.regencyFilter()).toContainText('Semua Kabupaten/Kota');
        await expect(this.regencyFilter()).toBeDisabled();
    }

    async verifyPagination() {
        const pageSize = this.page.getByRole('combobox', { name: /Baris per halaman:/ });
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
        await expect(this.page.getByRole('tab', { name: 'Profil Koordinator' })).toBeVisible();
    }

    async addCoordinator(data: CoordinatorData) {
        await this.page.getByRole('textbox', { name: 'Nama Koordinator *' }).fill(data.name);
        await this.page.getByRole('textbox', { name: 'Phone 1 *' }).fill(data.phone);
        await this.selectProvinceArea(data.province);

        await this.page.getByRole('button', { name: 'Simpan Koordinator', exact: true }).click();
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
        const responsePromise = this.waitForCoordinatorResponse(true);
        await this.page.getByRole('button', { name: 'Cari Koordinator', exact: true }).click();
        await this.captureApi(await responsePromise);
        await expect(
            this.page.getByRole('button', { name: 'Edit' }).first().or(this.emptyState())
        ).toBeVisible();
    }

    private async ensureListPage() {
        if (!/\/master\/koordinator(?:\?|$)/.test(this.page.url())) {
            await this.goto();
            await this.verifyPageLoaded();
        }
    }

    private async selectProvinceArea(province: string) {
        await this.page.getByRole('button', { name: 'Pilih Propinsi' }).click();
        const dialog = this.page.getByRole('dialog', { name: 'Pilih Propinsi Area' });
        await expect(dialog.getByRole('progressbar')).toBeHidden();
        await dialog.getByRole('checkbox', { name: province, exact: true }).check();
        await dialog.getByRole('button', { name: 'Terapkan', exact: true }).click();
        await expect(dialog).toBeHidden();
    }

    private async selectOption(combobox: ReturnType<Page['getByRole']>, option: string) {
        await combobox.click();
        await this.page.getByRole('option', { name: option, exact: true }).click();
    }

    private provinceFilter() {
        return this.page.getByRole('combobox').filter({ hasText: 'Semua Propinsi' });
    }

    private regencyFilter() {
        return this.page.getByRole('combobox').filter({ hasText: 'Semua Kabupaten/Kota' });
    }

    private emptyState() {
        return this.page.getByText(/No (?:rows to display|data available)/);
    }

    private waitForCoordinatorResponse(search: boolean) {
        return this.page.waitForResponse((response) =>
            response.url().includes('/api/reference/koordinator?') &&
            response.url().includes(`search=${search}`) &&
            response.request().method() === 'GET'
        );
    }

    private async captureApi(response: Awaited<ReturnType<Page['waitForResponse']>>) {
        this.authorization = response.request().headers()['authorization'];
        this.apiOrigin = new URL(response.url()).origin;
    }
}
