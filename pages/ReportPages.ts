import { expect, Page } from '@playwright/test';

const REPORT_TIMEOUT = 150_000;
const filterButton = /^(Filter Data|Filter)$/;
const showReportButton = /^(Tampilkan Report|Filter Data|Show Report)$/;
const totalSummaryText = /TOTAL KESELURUHAN|OVERALL TOTAL|Grand Total|Province Summary|Regency Summary|Direktorat Summary/;

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
    const labelAliases: Record<string, RegExp> = {
        'Semua Direktorat': /Semua Direktorat|All Directorates/,
        'Semua Propinsi': /Semua Propinsi|All Provinces/,
    };
    const combobox = page.getByRole('combobox')
        .filter({ hasText: labelAliases[currentLabel] ?? new RegExp(currentLabel) })
        .first();
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
        await expect(this.page.getByRole('textbox', { name: /Dari Tanggal|Start Date/ })).toBeVisible();
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(/Rekap Progress Harian|Progress Recap/)).toBeVisible();
        await expect(this.page.getByRole('button', { name: /Tarik Data|Filter Data/ })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async filterAndReset() {
        const startDate = this.page.getByRole('textbox', { name: /Dari Tanggal|Start Date/ });
        const endDateInput = this.page.getByRole('textbox', { name: /Sampai Tanggal|End Date/ });
        const endDate = await endDateInput.inputValue();
        await waitForReport(this.page, '/report/rekap_progress', async () => {
            await startDate.fill(endDate);
            await selectFirstRealOption(this.page, 'Semua Direktorat');
            await this.page.getByRole('button', { name: /Tarik Data|Filter Data/ }).click();
        }, (url) => url.searchParams.get('start_date') === endDate &&
            url.searchParams.get('end_date') === endDate
        );
        await this.waitUntilReady();

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: /Semua Direktorat|All Directorates/ }))
            .toBeVisible();
        await expect(startDate).not.toHaveValue('');
        await expect(endDateInput).not.toHaveValue('');
    }

    private async waitUntilReady() {
        await expect(this.page.getByText(/Loading data\.\.\.|Memuat Laporan\.\.\./))
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
        this.title = kind === 'koordinator'
            ? 'Ranking SLA Koordinator|Coordinator SLA Ranking'
            : 'Ranking SLA Teknisi|Technician SLA Ranking';
    }

    async goto() {
        await waitForReport(this.page, this.endpoint, () => this.page.goto(this.route));
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(new RegExp(this.title))).toBeVisible();
        await expect(this.page.getByRole('button', { name: filterButton })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
    }

    async filterByProvinceAndReset() {
        await waitForReport(this.page, this.endpoint, async () => {
            await selectFirstRealOption(this.page, 'Semua Propinsi');
            await this.page.getByRole('button', { name: filterButton }).click();
        });
        await expect(this.page.getByRole('heading', { name: /Leaderboard Skor SLA|SLA Score Leaderboard/ })).toBeVisible();

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: /Semua Propinsi|All Provinces/ }))
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
        title: 'Rekap Per Propinsi|Recap per Province',
        filter: 'Semua Direktorat',
    },
    kabupaten: {
        route: '/report/rekap_per_kabupaten',
        endpoint: '/report/rekap_kabupaten',
        title: 'Rekap Per Kabupaten|Recap per Regency',
        filter: 'Semua Propinsi',
    },
    direktorat: {
        route: '/report/rekap_per_direktorat',
        endpoint: '/report/rekap_direktorat',
        title: 'Rekap Per Direktorat|Recap per Directorate',
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
        await expect(this.page.getByRole('button', { name: showReportButton }))
            .toBeVisible({ timeout: REPORT_TIMEOUT });
        await this.page.waitForTimeout(5_000);
        await this.waitUntilReady();
    }

    async verifyPageLoaded() {
        await expect(this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText(new RegExp(this.config.title))).toBeVisible();
        await expect(this.page.getByRole('button', { name: showReportButton })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Reset' })).toBeVisible();
        await expect(this.page.getByText(totalSummaryText).first())
            .toBeVisible({ timeout: REPORT_TIMEOUT });
    }

    async filterAndReset() {
        await selectFirstRealOption(this.page, this.config.filter);
        await this.page.getByRole('button', { name: showReportButton }).click();

        // Filter dapat memakai state/cache sehingga tidak selalu mengirim request baru.
        // Beri waktu render, lalu jadikan kondisi UI sebagai sumber kebenaran.
        await this.page.waitForTimeout(5_000);
        await this.waitUntilReady();
        await expect(this.page.getByText(totalSummaryText).first())
            .toBeVisible({ timeout: REPORT_TIMEOUT });

        await this.page.getByRole('button', { name: 'Reset' }).click();
        await expect(this.page.getByRole('combobox')
            .filter({ hasText: this.config.filter === 'Semua Direktorat'
                ? /Semua Direktorat|All Directorates/
                : /Semua Propinsi|All Provinces/
            }))
            .toBeVisible();
    }

    private async waitUntilReady() {
        await expect(this.page.getByText(/Memuat Laporan\.\.\.|Loading data\.\.\./))
            .toBeHidden({ timeout: REPORT_TIMEOUT });
    }
}
