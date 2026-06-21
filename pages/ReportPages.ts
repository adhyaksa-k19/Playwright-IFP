import { expect, Page } from '@playwright/test';

const REPORT_TIMEOUT = 150_000;

async function waitForReport(
    page: Page,
    endpoint: string,
    action: () => Promise<unknown>,
    matches: (url: URL) => boolean = () => true
) {
    const response = page.waitForResponse((item) => {
        const url = new URL(item.url());
        return url.pathname === `/api${endpoint}` &&
            item.request().method() === 'GET' && matches(url);
    }, { timeout: REPORT_TIMEOUT });
    await action();
    const result = await response;
    expect(result.ok(), `HTTP ${result.status()} untuk ${endpoint}`).toBeTruthy();
    await page.waitForTimeout(5_000);
    return result;
}

async function selectFirstRealOption(page: Page, currentLabel: string) {
    const combobox = page.getByRole('combobox').filter({ hasText: currentLabel }).first();
    await combobox.click();
    const options = page.getByRole('option');
    await expect(options.nth(1)).toBeVisible();
    const option = options.nth(1);
    const label = (await option.textContent())!.trim();
    await option.click();
    return label;
}

export class RekapProgressPage {
    constructor(private readonly page: Page) {}

    async goto() {
        await this.page.goto('/report/rekap_progress');
        await expect(this.page.getByRole('textbox', { name: 'Dari Tanggal' })).toBeVisible();
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Rekap Progress Harian')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Tarik Data' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async filterAndReset() {
        const endDate = await this.page.getByRole('textbox', { name: 'Sampai Tanggal' }).inputValue();
        await waitForReport(this.page, '/report/rekap_progress', async () => {
            await this.page.getByRole('textbox', { name: 'Dari Tanggal' }).fill(endDate);
            await selectFirstRealOption(this.page, 'Semua Direktorat');
            await this.page.getByRole('button', { name: 'Tarik Data' }).click();
        }, (url) => url.searchParams.get('start_date') === endDate &&
            url.searchParams.get('end_date') === endDate
        );
        await this.waitUntilReady();

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: 'Semua Direktorat' }))
            .toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Dari Tanggal' })).not.toHaveValue('');
        await expect(this.page.getByRole('textbox', { name: 'Sampai Tanggal' })).not.toHaveValue('');
    }

    private async waitUntilReady() {
        await expect(this.page.getByText('Loading data...', { exact: true }))
            .toBeHidden({ timeout: REPORT_TIMEOUT });
    }
}

type SlaKind = 'koordinator' | 'teknisi';

export class SlaReportPage {
    private readonly endpoint: string;
    private readonly route: string;
    private readonly title: string;

    constructor(private readonly page: Page, kind: SlaKind) {
        this.endpoint = `/report/peringkat-${kind}`;
        this.route = `/report/sla_${kind}`;
        this.title = `Ranking SLA ${kind === 'koordinator' ? 'Koordinator' : 'Teknisi'}`;
    }

    async goto() {
        await waitForReport(this.page, this.endpoint, () => this.page.goto(this.route));
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(this.title)).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Filter Data' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async filterByProvinceAndReset() {
        await waitForReport(this.page, this.endpoint, async () => {
            await selectFirstRealOption(this.page, 'Semua Propinsi');
            await this.page.getByRole('button', { name: 'Filter Data' }).click();
        });
        await expect(this.page.getByRole('heading', { name: /Leaderboard Skor SLA/ })).toBeVisible();

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: 'Semua Propinsi' }))
            .toBeVisible();
    }

    async verifyPagination() {
        const pagination = this.page.getByRole('navigation', { name: 'pagination navigation' });
        const next = pagination.getByRole('button', { name: 'Go to next page' });
        await expect(next).toBeEnabled();
        await next.click();
        await expect(pagination.getByRole('button', { name: 'page 2', exact: true })).toBeVisible();
        await expect(pagination.getByRole('button', { name: 'Go to previous page' })).toBeEnabled();
    }
}

type RekapKind = 'propinsi' | 'kabupaten' | 'direktorat';

const rekapConfig: Record<RekapKind, {
    route: string;
    endpoint: string;
    title: string;
    filter: string;
}> = {
    propinsi: {
        route: '/report/rekap_per_propinsi',
        endpoint: '/report/rekap_propinsi',
        title: 'Rekap Per Propinsi',
        filter: 'Semua Direktorat',
    },
    kabupaten: {
        route: '/report/rekap_per_kabupaten',
        endpoint: '/report/rekap_kabupaten',
        title: 'Rekap Per Kabupaten',
        filter: 'Semua Propinsi',
    },
    direktorat: {
        route: '/report/rekap_per_direktorat',
        endpoint: '/report/rekap_direktorat',
        title: 'Rekap Per Direktorat',
        filter: 'Semua Propinsi',
    },
};

export class RekapWilayahPage {
    private readonly config: typeof rekapConfig[RekapKind];

    constructor(private readonly page: Page, kind: RekapKind) {
        this.config = rekapConfig[kind];
    }

    async goto() {
        await this.page.goto(this.config.route);
        await expect(this.page.getByRole('button', { name: 'Tampilkan Report' }))
            .toBeVisible({ timeout: REPORT_TIMEOUT });
        await this.page.waitForTimeout(5_000);
        await this.waitUntilReady();
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(this.config.title)).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Tampilkan Report' })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
        await expect(this.page.getByText('TOTAL KESELURUHAN', { exact: true }))
            .toBeVisible({ timeout: REPORT_TIMEOUT });
    }

    async filterAndReset() {
        await selectFirstRealOption(this.page, this.config.filter);
        await this.page.getByRole('button', { name: 'Tampilkan Report' }).click();

        // Filter dapat memakai state/cache sehingga tidak selalu mengirim request baru.
        // Beri waktu render, lalu jadikan kondisi UI sebagai sumber kebenaran.
        await this.page.waitForTimeout(5_000);
        await this.waitUntilReady();
        await expect(this.page.getByText('TOTAL KESELURUHAN', { exact: true }))
            .toBeVisible({ timeout: REPORT_TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: this.config.filter }))
            .toBeVisible();
    }

    private async waitUntilReady() {
        await expect(this.page.getByText('Memuat Laporan...', { exact: true }))
            .toBeHidden({ timeout: REPORT_TIMEOUT });
    }
}
