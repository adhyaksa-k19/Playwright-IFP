import { Page, expect } from '@playwright/test';

export class DashboardPage {

    constructor(private page: Page) {}

    private menuLabel(name: string) {
        const labels: Record<string, RegExp> = {
            Transaksi: /^(Transaksi|Transaction)$/,
            'Menu Administrasi': /^(Menu Administrasi|Administration Menu)$/,
        };

        return labels[name] ?? new RegExp(`^${name}$`);
    }

    private cardLabel(name: string) {
        const labels: Record<string, RegExp> = {
            'Sudah Assign Koordinator': /Sudah Assign Koordinator|Coordinator Assigned/i,
        };

        return labels[name] ?? new RegExp(name, 'i');
    }

    private coordinatorFilter() {
        return this.page.getByRole('combobox', {
            name: /^(Filter Koordinator|Filter Coordinator)$/,
        });
    }

    // ─── Navigation ──────────────────────────────────────────────

    async goto() {
        await this.page.goto('/dashboard');
    }

    // ─── Core Checks ─────────────────────────────────────────────

async verifyDashboardLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.page.getByRole('main')).toBeVisible();
    await expect(
        this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Dashboard', { exact: true })
    ).toBeVisible();
    await expect(
        this.coordinatorFilter()
    ).toBeVisible();
}

    // ─── Sidebar ─────────────────────────────────────────────────

async verifySidebarMenu() {
    const menus = [
        'Dashboard',
        'Monitoring',
        'Master',
        'Transaksi',
        'Report',
        'Finance',
        'Menu Administrasi',
    ];

    for (const menu of menus) {
        await expect(
            this.page.getByRole('button', { name: this.menuLabel(menu) })
        ).toBeVisible();
    }
}

async clickSidebarMenu(menuName: string) {
    await this.page
        .getByRole('button', { name: menuName, exact: true })
        .click();
}

    // ─── Summary Cards ────────────────────────────────────────────

    async verifySummaryCards() {
        const cards = [
            'Total Alokasi',
            'Barang Siap',
            'Proses Pengiriman',
            'Menuju Alamat',
            'Pengiriman Gagal',
            'Siap Diinstal',
        ];

        for (const card of cards) {
            await expect(
                this.page.getByRole('button', { name: this.cardLabel(card) })
            ).toBeVisible();
        }
    }

    async getSummaryCardCount(cardName: string): Promise<string> {
        const card = this.page.getByRole('button', {
            name: this.cardLabel(cardName),
        });
        await expect(card).toBeVisible();
        await expect(card).toContainText(/\d/, { timeout: 35_000 });
        return (await card.textContent()) ?? '';
    }

    // ─── Status Cards ─────────────────────────────────────────────

    async verifyStatusCards() {
        const statuses = [
            'Sudah Assign Koordinator',
            'Proses Instalasi',
            'Instalasi Terkendala',
            'Instalasi Gagal',
            'Instalasi Selesai',
            'Revisi',
            'Disetujui',
            'Reviu APIP',
            'Sesuai APIP',
            'Pengajuan Penarikan',
        ];

        for (const status of statuses) {
            await expect(
                this.page.getByRole('button', { name: this.cardLabel(status) })
            ).toBeVisible();
        }
    }

    // ─── Charts ───────────────────────────────────────────────────

    async verifyCharts() {
        await expect(
            this.page.getByText(/Proporsi Status|Status Proportion/)
        ).toBeVisible();

        await expect(
            this.page.getByText(/Progress per Propinsi|Progress per Province/)
        ).toBeVisible();
    }

    // ─── Filter Coordinator ───────────────────────────────────────

async verifyFilterCoordinator() {
    await expect(
        this.coordinatorFilter()
    ).toBeVisible();
}

    async applyFilterCoordinator(coordinatorName: string) {
        const filterInput = this.coordinatorFilter();
        await filterInput.fill(coordinatorName);
        await this.page.getByRole('option', { name: coordinatorName, exact: true }).click();
        await expect(filterInput).toHaveValue(coordinatorName);
    }
}
