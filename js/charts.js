/**
 * SilentAlert Interactive Chart Engine
 * Powered by Chart.js for real-time acoustic telemetry visualization.
 */

const charts = {
    barChart: null,
    lineChart: null,
    pieChart: null,
    zoneDetailChart: null,

    getThemeColors() {
        const isDark = document.documentElement.classList.contains('dark');
        return {
            textColor: isDark ? '#94a3b8' : '#64748b',
            gridColor: isDark ? '#334155' : '#f1f5f9',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            primary: '#ef4444',
            secondary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            background: isDark ? '#0f172a' : '#ffffff'
        };
    },

    // Initialize all 3 dashboard charts
    async initDashboardCharts() {
        try {
            const data = await api.noise.getAnalytics();
            this.renderBarChart(data.zoneAverages);
            this.renderLineChart(data.timeSeries);
            this.renderPieChart(data.statusDistribution);
        } catch (e) {
            console.warn('Analytics loading fallback:', e.message);
        }
    },

    // 1. BAR CHART: Average Decibels by Monitored Zone
    renderBarChart(zoneAverages = []) {
        const ctx = document.getElementById('chart-bar-zones');
        if (!ctx) return;

        const colors = this.getThemeColors();
        const labels = zoneAverages.length ? zoneAverages.map(z => z.name.split(' ')[0] + ' ' + (z.name.split(' ')[1] || '')) : ['Library', 'ICU Ward', 'Robo Lab', 'Boardroom', 'Exam Hall'];
        const values = zoneAverages.length ? zoneAverages.map(z => z.current) : [42, 46, 58, 44, 38];
        const thresholds = zoneAverages.length ? zoneAverages.map(z => z.threshold) : [55, 50, 65, 60, 52];

        if (this.barChart) this.barChart.destroy();

        this.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Current Acoustic SPL (dB)',
                        data: values,
                        backgroundColor: values.map(v => v >= 70 ? '#ef4444' : (v >= 60 ? '#f59e0b' : '#10b981')),
                        borderRadius: 8,
                        barThickness: 24
                    },
                    {
                        label: 'Threshold Limit (dB)',
                        data: thresholds,
                        type: 'line',
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 4,
                        pointBackgroundColor: '#94a3b8'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} dB`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 90,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    },

    // 2. LINE CHART: Real-time Telemetry Trend Over Time
    renderLineChart(timeSeries = []) {
        const ctx = document.getElementById('chart-line-telemetry');
        if (!ctx) return;

        const colors = this.getThemeColors();
        const labels = timeSeries.length ? timeSeries.map(t => t.timestamp) : ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'];
        const libData = timeSeries.length ? timeSeries.map(t => t.library || 42) : [40, 42, 45, 41, 48, 43];
        const classData = timeSeries.length ? timeSeries.map(t => t.classroom || 50) : [48, 52, 55, 62, 58, 51];
        const labData = timeSeries.length ? timeSeries.map(t => t.lab || 46) : [45, 46, 50, 49, 47, 48];

        if (this.lineChart) this.lineChart.destroy();

        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Library (Silent)',
                        data: libData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 2
                    },
                    {
                        label: 'Classroom',
                        data: classData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 2
                    },
                    {
                        label: 'Nanotech Lab',
                        data: labData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.05)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } }
                    }
                },
                scales: {
                    y: {
                        min: 25,
                        max: 85,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor, maxTicksLimit: 8 }
                    }
                }
            }
        });
    },

    // 3. PIE / DOUGHNUT CHART: Zone Noise Status Distribution
    renderPieChart(distribution = { normal: 6, warning: 1, critical: 1 }) {
        const ctx = document.getElementById('chart-pie-status');
        if (!ctx) return;

        const colors = this.getThemeColors();
        const norm = distribution.normal !== undefined ? distribution.normal : 6;
        const warn = distribution.warning !== undefined ? distribution.warning : 1;
        const crit = distribution.critical !== undefined ? distribution.critical : 1;

        if (this.pieChart) this.pieChart.destroy();

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal (<60 dB)', 'Warning (60-70 dB)', 'Critical Alert (>70 dB)'],
                datasets: [{
                    data: [norm, warn, crit],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: colors.background
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', weight: '500' } }
                    }
                },
                cutout: '65%'
            }
        });
    },

    // Render single zone gauge trend in Details Modal
    renderZoneDetailChart(zone) {
        const ctx = document.getElementById('chart-zone-detail-trend');
        if (!ctx) return;

        const colors = this.getThemeColors();
        const baseline = zone.currentLevel || 45;
        const trendData = [
            baseline - 3,
            baseline + 2,
            baseline - 1,
            baseline + 4,
            baseline,
            baseline + 1
        ];

        if (this.zoneDetailChart) this.zoneDetailChart.destroy();

        this.zoneDetailChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
                datasets: [{
                    label: `${zone.name} Trend (dB)`,
                    data: trendData,
                    borderColor: baseline >= 70 ? '#ef4444' : (baseline >= 60 ? '#f59e0b' : '#10b981'),
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: Math.max(20, baseline - 15),
                        max: baseline + 15,
                        grid: { color: colors.gridColor },
                        ticks: { color: colors.textColor }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor }
                    }
                }
            }
        });
    },

    // Called when theme toggles
    refreshTheme() {
        this.initDashboardCharts();
    }
};

window.charts = charts;
