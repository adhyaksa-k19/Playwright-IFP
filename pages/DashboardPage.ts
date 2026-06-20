import { Page, expect } from '@playwright/test';

export class DashboardPage {

    constructor(private page: Page) {}

    async verifyDashboardLoaded() {

        await expect(this.page).toHaveURL(/dashboard/);

        await expect(
            this.page.locator('body')
        ).toContainText('Dashboard');
    }

    async verifySidebarMenu() {

        const menus = [
            'Dashboard',
            'Monitoring',
            'Master',
            'Transaksi',
            'Report',
            'Finance',
            'Menu Administrasi'
        ];

        for (const menu of menus) {
            await expect(
                this.page.locator('body')
            ).toContainText(menu);
        }
    }

    async verifySummaryCards() {

    const cards = [
        'Total Alokasi',
        'Barang Siap',
        'Proses Pengiriman',
        'Menuju Alamat',
        'Pengiriman Gagal',
        'Siap Diinstal'
    ];

    for (const card of cards) {
        await expect(
            this.page.getByRole('button', { name: new RegExp(card, 'i') })
        ).toBeVisible();
    }
}

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
        'Pengajuan Penarikan'
    ];

    for (const status of statuses) {
        await expect(
            this.page.getByRole(
                'button',
                { name: new RegExp(status, 'i') }
            )
        ).toBeVisible();
    }
}

    async verifyCharts() {

        await expect(
            this.page.locator('body')
        ).toContainText('Proporsi Status');

        await expect(
            this.page.locator('body')
        ).toContainText('Progress per Propinsi');
    }

    async verifyFilterCoordinator() {

        await expect(
            this.page.locator('body')
        ).toContainText('Filter Koordinator');
    }
}