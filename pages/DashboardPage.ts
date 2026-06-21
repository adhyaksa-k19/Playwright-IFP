import { Page, expect } from '@playwright/test';

export class DashboardPage {

    constructor(private page: Page) {}

    // ─── Navigation ──────────────────────────────────────────────

    async goto() {
        await this.page.goto('/dashboard');
    }

    // ─── Core Checks ─────────────────────────────────────────────

async verifyDashboardLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(
        this.page.getByRole('navigation', { name: 'breadcrumb' })
            .getByText('Dashboard', { exact: true })
    ).toBeVisible();
    await expect(
        this.page.getByRole('combobox', { name: 'Filter Koordinator' })
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
            this.page.getByRole('button', { name: menu, exact: true })
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
                this.page.getByRole('button', { name: new RegExp(card, 'i') })
            ).toBeVisible();
        }
    }

    async getSummaryCardCount(cardName: string): Promise<string> {
        const card = this.page.getByRole('button', {
            name: new RegExp(cardName, 'i'),
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
                this.page.getByRole('button', { name: new RegExp(status, 'i') })
            ).toBeVisible();
        }
    }

    // ─── Charts ───────────────────────────────────────────────────

    async verifyCharts() {
        await expect(
            this.page.getByText('Proporsi Status')
        ).toBeVisible();

        await expect(
            this.page.getByText('Progress per Propinsi')
        ).toBeVisible();
    }

    // ─── Filter Coordinator ───────────────────────────────────────

async verifyFilterCoordinator() {
    await expect(
        this.page.getByRole('combobox', { name: 'Filter Koordinator' })
    ).toBeVisible();
}

    async applyFilterCoordinator(coordinatorName: string) {
        const filterInput = this.page.getByRole('combobox', {
            name: 'Filter Koordinator',
        });
        await filterInput.fill(coordinatorName);
        await this.page.getByRole('option', { name: coordinatorName, exact: true }).click();
        await expect(filterInput).toHaveValue(coordinatorName);
    }
}
