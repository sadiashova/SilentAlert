/**
 * SilentAlert Main Application Controller
 * Handles SPA page routing, explore page filtering/pagination, zone details modal,
 * dashboard tables, live polling, and hardware telemetry simulation.
 */

const app = {
    currentPage: 'home',
    currentDashboardTab: 'overview',
    pollingTimer: null,
    exploreState: {
        page: 1,
        limit: 8,
        search: '',
        category: 'All',
        status: 'All',
        sort: 'name-asc',
        totalPages: 1
    },
    activeDetailZone: null,

    init() {
        ui.initTheme();
        auth.init();
        ui.initWaveformSimulator();

        // Bind Global Form Submissions
        this.bindForms();

        // Check URL Hash or default to Home
        const hash = window.location.hash.replace('#', '') || 'home';
        this.showPage(hash);

        // Fetch dynamic platform overview stats
        this.loadDynamicStats();

        // Start live acoustic telemetry polling
        this.startTelemetryPolling();

        // Initial fetch of featured zones on Home page
        this.loadFeaturedZones();
    },

    // --- NAVIGATION ROUTER ---
    showPage(pageId) {
        this.currentPage = pageId;
        window.location.hash = pageId;

        // Hide all top-level page views
        document.querySelectorAll('.app-page-view').forEach(p => p.classList.add('hidden'));

        // Show requested page view
        const targetPage = document.getElementById(`view-${pageId}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        } else {
            // Default back to home if page doesn't exist
            document.getElementById('view-home').classList.remove('hidden');
            this.currentPage = 'home';
        }

        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-drawer');
        if (mobileMenu) mobileMenu.classList.add('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Page specific initialization hooks
        charts.stopLiveUpdates();
        if (pageId === 'explore') {
            this.loadExploreZones();
        } else if (pageId === 'dashboard') {
            if (!auth.isAuthenticated()) {
                ui.toast('Please log in to access the Acoustic Dashboard.', 'warning');
                this.showPage('login');
                return;
            }
            this.showDashboardTab(this.currentDashboardTab || 'overview');
        } else if (pageId === 'home') {
            this.loadFeaturedZones();
            this.loadDynamicStats();
        }
    },

    // --- DASHBOARD SUB-TAB ROUTER ---
    showDashboardTab(tabId) {
        this.currentDashboardTab = tabId;

        // Hide all dashboard tabs
        document.querySelectorAll('.dashboard-tab-content').forEach(tab => tab.classList.add('hidden'));

        // Show selected tab
        const targetTab = document.getElementById(`dash-tab-${tabId}`);
        if (targetTab) targetTab.classList.remove('hidden');

        // Update active sidebar link styling
        document.querySelectorAll('.dash-sidebar-btn').forEach(btn => {
            const isTarget = btn.dataset.tab === tabId;
            btn.classList.toggle('bg-red-600', isTarget);
            btn.classList.toggle('text-white', isTarget);
            btn.classList.toggle('text-slate-400', !isTarget);
        });

        // Tab-specific loading
        if (tabId === 'overview') {
            charts.initDashboardCharts();
            charts.startLiveUpdates();
            this.loadDashboardZoneCards();
        } else if (tabId === 'zones') {
            this.loadAdminZonesTable();
        } else if (tabId === 'heatmap') {
            this.updateHeatmap();
        } else if (tabId === 'reports') {
            this.loadReportsTable();
        } else if (tabId === 'users' && auth.isAdmin()) {
            this.loadUsersTable();
        }
    },

    // --- DYNAMIC PLATFORM OVERVIEW STATS (FROM BACKEND) ---
    async loadDynamicStats() {
        try {
            const res = await api.stats.getOverview();
            if (res && res.stats) {
                const s = res.stats;
                const updateEl = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = val;
                };

                updateEl('stat-total-zones', s.totalZones);
                updateEl('stat-total-logs', s.totalLogs.toLocaleString());
                updateEl('stat-active-alerts', s.activeAlerts);
                updateEl('stat-mcu-nodes', s.connectedMcuNodes);
                updateEl('stat-compliance-rate', `${s.complianceRate}%`);
                updateEl('stat-avg-decibel', `${s.averageDecibel} dB`);
                updateEl('stat-system-health', s.systemHealth);
            }
        } catch (e) {
            console.warn('Could not load dynamic stats:', e.message);
        }
    },

    // --- HOME PAGE FEATURED MONITORED ZONES ---
    async loadFeaturedZones() {
        const container = document.getElementById('featured-zones-container');
        if (!container) return;

        ui.renderCardSkeletons('featured-zones-container', 4);

        try {
            const res = await api.zones.getAll({ limit: 4, sort: 'name-asc' });
            if (res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(zone => this.renderZoneCard(zone)).join('');
            } else {
                container.innerHTML = `<div class="col-span-4 text-center py-8 text-slate-500">No active zones recorded yet.</div>`;
            }
        } catch (err) {
            container.innerHTML = `<div class="col-span-4 text-center py-8 text-red-500">Unable to load featured zones from backend.</div>`;
        }
    },

    // --- EXPLORE / LISTING PAGE WITH SEARCH, FILTERS, SORT & PAGINATION ---
    async loadExploreZones() {
        const container = document.getElementById('explore-zones-grid');
        if (!container) return;

        ui.renderCardSkeletons('explore-zones-grid', 8);

        const params = {
            page: this.exploreState.page,
            limit: this.exploreState.limit,
            search: this.exploreState.search,
            category: this.exploreState.category,
            status: this.exploreState.status,
            sort: this.exploreState.sort
        };

        try {
            const res = await api.zones.getAll(params);
            this.exploreState.totalPages = res.pages || 1;

            if (res.data && res.data.length > 0) {
                container.innerHTML = res.data.map(zone => this.renderZoneCard(zone)).join('');
            } else {
                container.innerHTML = `
                    <div class="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                        <i class="fas fa-search text-slate-400 text-4xl mb-4"></i>
                        <h3 class="text-lg font-bold text-slate-700 dark:text-slate-200">No Monitored Zones Match Your Filter</h3>
                        <p class="text-sm text-slate-500 mt-1">Try clearing your search query or choosing a different facility sector.</p>
                        <button onclick="app.resetExploreFilters()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Reset Filters</button>
                    </div>
                `;
            }

            this.renderExplorePagination(res.page, res.pages, res.total);
        } catch (err) {
            container.innerHTML = `<div class="col-span-full text-center py-12 text-red-500">Failed to fetch acoustic zones. Verify backend server is running.</div>`;
        }
    },

    renderZoneCard(zone) {
        const isCritical = zone.status === 'critical' || (zone.currentLevel >= zone.threshold + 10);
        const isWarning = zone.status === 'warning' || (zone.currentLevel >= zone.threshold);

        let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
        let badgeLabel = 'NORMAL';
        if (isCritical) {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse';
            badgeLabel = 'CRITICAL ALERT';
        } else if (isWarning) {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
            badgeLabel = 'WARNING';
        }

        const mcuName = (zone.hardwareNode && zone.hardwareNode.mcu) || 'Arduino Nano';

        return `
            <div class="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                <div class="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src="${zone.image || 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80'}" 
                         alt="${zone.name}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         loading="lazy">
                    <div class="absolute top-3 left-3">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}">
                            ${badgeLabel}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">
                        <i class="fas fa-microchip text-red-400 mr-1"></i>${mcuName.includes('Nano') ? 'Arduino Nano' : 'Edge Node'}
                    </div>
                </div>

                <div class="p-5 flex-1 flex flex-col">
                    <div class="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        <span class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">${zone.category || 'Facility'}</span>
                        <span>&bull;</span>
                        <span class="truncate"><i class="fas fa-map-marker-alt text-red-500 mr-1"></i>${zone.location}</span>
                    </div>

                    <h3 class="font-bold text-slate-900 dark:text-white text-base mb-2 group-hover:text-red-600 transition">
                        ${zone.name}
                    </h3>

                    <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                        ${zone.description}
                    </p>

                    <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-400 block font-medium">Live Reading</span>
                            <span class="text-2xl font-black ${isCritical ? 'text-red-600' : (isWarning ? 'text-amber-500' : 'text-emerald-600')}">
                                ${zone.currentLevel || 45} <span class="text-xs font-normal text-slate-400">dB</span>
                            </span>
                            <span class="text-[10px] text-slate-400 block">Limit: ${zone.threshold} dB</span>
                        </div>

                        <button onclick="app.openZoneDetails('${zone._id}')" 
                                class="px-3.5 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                            <span>View Details</span>
                            <i class="fas fa-arrow-right text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderExplorePagination(currentPage, totalPages, totalCount) {
        const container = document.getElementById('explore-pagination-container');
        if (!container) return;

        let pagesHtml = `
            <div class="flex items-center justify-between w-full flex-wrap gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <div>
                    Showing page <span class="font-bold text-slate-900 dark:text-white">${currentPage}</span> of <span class="font-bold text-slate-900 dark:text-white">${totalPages}</span> (${totalCount} zones)
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="app.changeExplorePage(${currentPage - 1})" 
                            ${currentPage <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-slate-200 dark:hover:bg-slate-800"'} 
                            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold transition">
                        <i class="fas fa-chevron-left mr-1"></i> Prev
                    </button>
        `;

        for (let p = 1; p <= totalPages; p++) {
            const isActive = p === currentPage;
            pagesHtml += `
                <button onclick="app.changeExplorePage(${p})" 
                        class="w-8 h-8 rounded-lg font-bold text-xs transition ${isActive ? 'bg-red-600 text-white' : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                    ${p}
                </button>
            `;
        }

        pagesHtml += `
                    <button onclick="app.changeExplorePage(${currentPage + 1})" 
                            ${currentPage >= totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-slate-200 dark:hover:bg-slate-800"'} 
                            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 font-semibold transition">
                        Next <i class="fas fa-chevron-right ml-1"></i>
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = pagesHtml;
    },

    changeExplorePage(page) {
        if (page < 1 || page > this.exploreState.totalPages) return;
        this.exploreState.page = page;
        this.loadExploreZones();
        window.scrollTo({ top: document.getElementById('view-explore').offsetTop, behavior: 'smooth' });
    },

    resetExploreFilters() {
        this.exploreState = {
            page: 1,
            limit: 8,
            search: '',
            category: 'All',
            status: 'All',
            sort: 'name-asc',
            totalPages: 1
        };
        const searchInput = document.getElementById('explore-search-input');
        const categorySelect = document.getElementById('explore-category-filter');
        const statusSelect = document.getElementById('explore-status-filter');
        const sortSelect = document.getElementById('explore-sort-select');
        if (searchInput) searchInput.value = '';
        if (categorySelect) categorySelect.value = 'All';
        if (statusSelect) statusSelect.value = 'All';
        if (sortSelect) sortSelect.value = 'name-asc';
        this.loadExploreZones();
    },

    // --- ZONE DETAILS MODAL (PUBLICLY ACCESSIBLE) ---
    async openZoneDetails(zoneId) {
        ui.openModal('modal-zone-details');
        const contentBox = document.getElementById('modal-zone-details-content');
        if (!contentBox) return;

        contentBox.innerHTML = `
            <div class="py-16 text-center text-slate-400">
                <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                <p>Loading Acoustic Specifications...</p>
            </div>
        `;

        try {
            const res = await api.zones.getById(zoneId);
            const zone = res.data;
            this.activeDetailZone = zone;

            const isCritical = zone.status === 'critical' || (zone.currentLevel >= zone.threshold + 10);
            const isWarning = zone.status === 'warning' || (zone.currentLevel >= zone.threshold);

            let statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">NORMAL (<60 dB)</span>`;
            if (isCritical) {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">CRITICAL NOISE VIOLATION</span>`;
            } else if (isWarning) {
                statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">MODERATE WARNING</span>`;
            }

            const galleryImgs = (zone.gallery && zone.gallery.length > 0) ? zone.gallery : [zone.image];
            const hw = zone.hardwareNode || {};
            const specs = zone.acousticSpecs || {};

            contentBox.innerHTML = `
                <div class="space-y-6">
                    <!-- Media Section: Gallery / Slider -->
                    <div>
                        <div class="h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 relative">
                            <img id="detail-main-img" src="${galleryImgs[0]}" alt="${zone.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80';" class="w-full h-full object-cover">
                            <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div class="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white">
                                    <h2 class="text-xl font-bold">${zone.name}</h2>
                                    <p class="text-xs text-slate-300"><i class="fas fa-map-marker-alt text-red-400 mr-1"></i>${zone.location}</p>
                                </div>
                                <div>${statusBadge}</div>
                            </div>
                        </div>

                        <!-- Thumbnails -->
                        <div class="flex gap-2 mt-3 overflow-x-auto pb-1">
                            ${galleryImgs.map((img, i) => `
                                <img src="${img}" onclick="document.getElementById('detail-main-img').src='${img}'" 
                                     class="h-16 w-24 object-cover rounded-xl border-2 border-transparent hover:border-red-500 cursor-pointer transition shrink-0" 
                                     alt="Thumbnail ${i}">
                            `).join('')}
                        </div>
                    </div>

                    <!-- Overview & Description -->
                    <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <h4 class="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Zone Overview</h4>
                        <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">${zone.description}</p>
                    </div>

                    <!-- Key Specifications & Hardware Architecture -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-red-600 mb-3 flex items-center gap-2">
                                <i class="fas fa-microchip"></i> IoT Edge Hardware Node
                            </h4>
                            <ul class="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Node Identifier:</span>
                                    <span class="font-mono font-bold text-slate-800 dark:text-white">${hw.nodeId || 'ARDUINO-NANO-01'}</span>
                                </li>
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Microcontroller:</span>
                                    <span class="font-bold text-slate-800 dark:text-white">${hw.mcu || 'Arduino Nano (ATmega328P)'}</span>
                                </li>
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Transducer / Sensor:</span>
                                    <span class="font-bold text-slate-800 dark:text-white">${hw.sensorType || 'MAX4466 Electret Mic with AGC'}</span>
                                </li>
                                <li class="flex justify-between py-1">
                                    <span class="text-slate-400">Sampling Window:</span>
                                    <span class="font-bold text-slate-800 dark:text-white">${hw.samplingRate || '1000 Hz RMS'}</span>
                                </li>
                            </ul>
                        </div>

                        <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                                <i class="fas fa-sliders-h"></i> Acoustic Environment Criteria
                            </h4>
                            <ul class="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Current SPL:</span>
                                    <span class="font-bold text-slate-900 dark:text-white text-sm">${zone.currentLevel} dB</span>
                                </li>
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Permissible Threshold:</span>
                                    <span class="font-bold text-red-600 text-sm">${zone.threshold} dB</span>
                                </li>
                                <li class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                                    <span class="text-slate-400">Target Noise Rating:</span>
                                    <span class="font-bold text-slate-800 dark:text-white">${specs.noiseRatingCriterion || 'NC-25'}</span>
                                </li>
                                <li class="flex justify-between py-1">
                                    <span class="text-slate-400">Compliance Standard:</span>
                                    <span class="font-bold text-slate-800 dark:text-white">${specs.complianceStandard || 'ISO 1996-2 Quiet Room Standard'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Real-Time Noise Trend Chart for this Zone -->
                    <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                            <i class="fas fa-chart-line text-red-500 mr-1"></i> Live Acoustic Telemetry Trend (Past 30 Mins)
                        </h4>
                        <div class="h-44 w-full">
                            <canvas id="chart-zone-detail-trend"></canvas>
                        </div>
                    </div>

                    <!-- Related Monitored Zones -->
                    ${res.related && res.related.length > 0 ? `
                        <div>
                            <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-3">Related Monitored Zones in Same Sector</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                ${res.related.map(rel => `
                                    <div onclick="app.openZoneDetails('${rel._id}')" class="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 cursor-pointer transition flex items-center gap-3">
                                        <img src="${rel.image}" class="w-12 h-12 rounded-lg object-cover">
                                        <div class="overflow-hidden">
                                            <div class="text-xs font-bold text-slate-800 dark:text-white truncate">${rel.name}</div>
                                            <div class="text-[11px] text-slate-500">${rel.currentLevel} dB &bull; Limit ${rel.threshold} dB</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // Draw chart for this zone
            setTimeout(() => {
                charts.renderZoneDetailChart(zone);
            }, 100);

        } catch (err) {
            contentBox.innerHTML = `<div class="py-12 text-center text-red-500">Error retrieving zone specifications: ${err.message}</div>`;
        }
    },

    // --- DASHBOARD LIVE OVERVIEW CARDS ---
    async loadDashboardZoneCards() {
        const container = document.getElementById('dash-live-cards-container');
        if (!container) return;

        try {
            const res = await api.zones.getAll({ limit: 8 });
            if (res.data) {
                container.innerHTML = res.data.map(zone => {
                    const isCrit = zone.status === 'critical' || (zone.currentLevel >= zone.threshold + 10);
                    const isWarn = zone.status === 'warning' || (zone.currentLevel >= zone.threshold);
                    return `
                        <div class="p-4 rounded-2xl border ${isCrit ? 'bg-red-50/80 border-red-300 dark:bg-red-950/20 dark:border-red-900' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} shadow-sm">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">${zone.name}</h4>
                                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${isCrit ? 'bg-red-600 text-white' : (isWarn ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white')}">
                                    ${zone.status.toUpperCase()}
                                </span>
                            </div>
                            <div class="flex items-baseline gap-1 mt-1">
                                <span class="text-2xl font-black ${isCrit ? 'text-red-600' : 'text-slate-800 dark:text-white'}">${zone.currentLevel}</span>
                                <span class="text-xs text-slate-400">dB</span>
                                <span class="text-xs text-slate-400 ml-auto">Threshold: ${zone.threshold} dB</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {}
    },

    // --- DASHBOARD ZONES TABLE (ADMIN CRUD) ---
    async loadAdminZonesTable() {
        const tbody = document.getElementById('dash-zones-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading zones...</td></tr>`;

        try {
            const res = await api.zones.getAll({ limit: 50 });
            if (res.data && res.data.length > 0) {
                tbody.innerHTML = res.data.map(z => `
                    <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td class="p-4 font-bold text-slate-800 dark:text-slate-200">
                            <div class="flex items-center gap-2">
                                <img src="${z.image}" class="w-8 h-8 rounded-lg object-cover">
                                <div>
                                    <div>${z.name}</div>
                                    <div class="text-[11px] text-slate-400 font-normal">${z.category}</div>
                                </div>
                            </div>
                        </td>
                        <td class="p-4 text-xs text-slate-500">${z.location}</td>
                        <td class="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">${z.threshold} dB</td>
                        <td class="p-4">
                            <span class="text-sm font-bold ${z.status === 'critical' ? 'text-red-600' : 'text-emerald-600'}">${z.currentLevel} dB</span>
                        </td>
                        <td class="p-4">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${z.status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}">
                                ${z.status.toUpperCase()}
                            </span>
                        </td>
                        <td class="p-4 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button onclick="app.openZoneDetails('${z._id}')" class="p-1.5 text-slate-400 hover:text-blue-500 transition" title="View"><i class="fas fa-eye"></i></button>
                                <button onclick="app.openEditZoneModal('${z._id}')" class="p-1.5 text-slate-400 hover:text-amber-500 transition" title="Edit"><i class="fas fa-edit"></i></button>
                                <button onclick="app.handleDeleteZone('${z._id}')" class="p-1.5 text-slate-400 hover:text-red-500 transition" title="Delete"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">No zones found.</td></tr>`;
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-red-500">Error loading zones: ${e.message}</td></tr>`;
        }
    },

    // --- CREATE / EDIT ZONE MODAL ---
    openCreateZoneModal() {
        document.getElementById('zone-modal-title').innerText = 'Create New Monitored Zone';
        document.getElementById('zone-form').reset();
        document.getElementById('zone-id-input').value = '';
        ui.openModal('modal-zone-form');
    },

    async openEditZoneModal(zoneId) {
        document.getElementById('zone-modal-title').innerText = 'Edit Monitored Zone';
        ui.openModal('modal-zone-form');

        try {
            const res = await api.zones.getById(zoneId);
            const z = res.data;
            document.getElementById('zone-id-input').value = z._id;
            document.getElementById('form-zone-name').value = z.name || '';
            document.getElementById('form-zone-category').value = z.category || 'Library';
            document.getElementById('form-zone-location').value = z.location || '';
            document.getElementById('form-zone-threshold').value = z.threshold || 60;
            document.getElementById('form-zone-capacity').value = z.capacity || 40;
            document.getElementById('form-zone-desc').value = z.description || '';
            document.getElementById('form-zone-image').value = z.image || '';
        } catch (e) {
            ui.toast('Error fetching zone for edit: ' + e.message, 'error');
            ui.closeModal('modal-zone-form');
        }
    },

    async handleSaveZone(e) {
        e.preventDefault();
        const id = document.getElementById('zone-id-input').value;
        const name = document.getElementById('form-zone-name').value.trim();
        const category = document.getElementById('form-zone-category').value;
        const location = document.getElementById('form-zone-location').value.trim();
        const threshold = Number(document.getElementById('form-zone-threshold').value);
        const capacity = Number(document.getElementById('form-zone-capacity').value);
        const description = document.getElementById('form-zone-desc').value.trim();
        const image = document.getElementById('form-zone-image').value.trim();
        const submitBtn = document.getElementById('zone-form-submit-btn');

        if (!name || !location) {
            ui.toast('Zone name and location are required.', 'warning');
            return;
        }

        try {
            ui.setLoading(submitBtn, true, 'Saving Zone...');
            const payload = { name, category, location, threshold, capacity, description };
            if (image) payload.image = image;

            if (id) {
                await api.zones.update(id, payload);
                ui.toast('Zone updated successfully!', 'success');
            } else {
                await api.zones.create(payload);
                ui.toast('New Acoustic Zone registered successfully!', 'success');
            }

            ui.closeModal('modal-zone-form');
            this.loadAdminZonesTable();
            this.loadFeaturedZones();
            this.loadDynamicStats();
        } catch (err) {
            ui.toast(err.message || 'Error saving zone', 'error');
        } finally {
            ui.setLoading(submitBtn, false);
        }
    },

    async handleDeleteZone(zoneId) {
        if (!confirm('Are you sure you want to delete this monitored acoustic zone?')) return;
        try {
            await api.zones.delete(zoneId);
            ui.toast('Zone deleted successfully', 'success');
            this.loadAdminZonesTable();
            this.loadFeaturedZones();
            this.loadDynamicStats();
        } catch (err) {
            ui.toast(err.message || 'Error deleting zone', 'error');
        }
    },

    // --- DASHBOARD REPORTS TABLE & PDF EXPORT ---
    async loadReportsTable() {
        const tbody = document.getElementById('dash-reports-table-body');
        if (!tbody) return;

        try {
            const logs = await api.noise.getLogs(40);
            if (logs && logs.length > 0) {
                tbody.innerHTML = logs.map(log => {
                    const time = new Date(log.timestamp).toLocaleString();
                    const avg = log.averageDecibel || Math.round(((log.Library || 0) + (log.Classroom || 0) + (log.Lab || 0) + (log.ConferenceRoom || 0)) / 4);
                    const isAlert = avg >= 70;
                    return `
                        <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td class="p-3 text-xs text-slate-500">${time}</td>
                            <td class="p-3 text-xs font-semibold">${log.Library || '--'} dB</td>
                            <td class="p-3 text-xs font-semibold">${log.Classroom || '--'} dB</td>
                            <td class="p-3 text-xs font-semibold">${log.Lab || '--'} dB</td>
                            <td class="p-3 text-xs font-semibold">${log.ConferenceRoom || '--'} dB</td>
                            <td class="p-3 text-xs font-bold ${isAlert ? 'text-red-600' : 'text-slate-800 dark:text-white'}">${avg} dB</td>
                            <td class="p-3">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isAlert ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'}">
                                    ${isAlert ? 'CRITICAL ALERT' : 'NOMINAL'}
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-red-500">Error loading incident logs.</td></tr>`;
        }
    },

    exportReportsPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            window.print();
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(220, 38, 38);
        doc.text('SilentAlert Acoustic Incident & Telemetry Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()} | Target standard: ISO 1996-2 / WHO Guidelines`, 14, 28);

        // Fetch logs data from table
        const rows = [];
        document.querySelectorAll('#dash-reports-table-body tr').forEach(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
            if (cells.length >= 6) rows.push(cells);
        });

        if (doc.autoTable) {
            doc.autoTable({
                head: [['Timestamp', 'Library', 'Classroom', 'Lab', 'Conf. Room', 'Average', 'Status']],
                body: rows,
                startY: 34,
                theme: 'striped',
                headStyles: { fillColor: [15, 23, 42] }
            });
            doc.save(`SilentAlert-Acoustic-Report-${Date.now()}.pdf`);
            ui.toast('PDF Export generated successfully!', 'success');
        } else {
            window.print();
        }
    },

    // --- DASHBOARD ADMIN USERS TABLE ---
    async loadUsersTable() {
        const tbody = document.getElementById('dash-users-table-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading accounts...</td></tr>`;

        try {
            const res = await api.users.getAll();
            if (res.data) {
                tbody.innerHTML = res.data.map(u => `
                    <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td class="p-3">
                            <div class="flex items-center gap-2">
                                <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover">
                                <div>
                                    <div class="font-bold text-xs text-slate-800 dark:text-white">${u.name}</div>
                                    <div class="text-[11px] text-slate-400">${u.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="p-3 text-xs text-slate-500">${u.organization || 'Facility Admin'}</td>
                        <td class="p-3">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}">
                                ${u.role.toUpperCase()}
                            </span>
                        </td>
                        <td class="p-3 text-xs text-slate-400">${new Date(u.createdAt).toLocaleDateString()}</td>
                        <td class="p-3 text-right">
                            <button onclick="app.toggleUserRole('${u._id}', '${u.role === 'admin' ? 'user' : 'admin'}')" class="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded font-semibold transition mr-2">
                                Set to ${u.role === 'admin' ? 'User' : 'Admin'}
                            </button>
                            <button onclick="app.deleteUser('${u._id}')" class="text-xs text-red-500 hover:text-red-700 transition">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Error loading users.</td></tr>`;
        }
    },

    async toggleUserRole(userId, newRole) {
        try {
            await api.users.updateRole(userId, newRole);
            ui.toast(`User role set to ${newRole.toUpperCase()}`, 'success');
            this.loadUsersTable();
        } catch (e) {
            ui.toast(e.message || 'Error updating role', 'error');
        }
    },

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user account?')) return;
        try {
            await api.users.delete(userId);
            ui.toast('User removed successfully', 'success');
            this.loadUsersTable();
        } catch (e) {
            ui.toast(e.message || 'Error deleting user', 'error');
        }
    },

    // --- HEATMAP OVERLAY VISUALIZATION ---
    updateHeatmap(latestData = { Library: 44, Classroom: 52, Lab: 47, ConferenceRoom: 38 }) {
        const overlay = document.getElementById('heatmap-overlay');
        const labels = document.getElementById('heatmap-labels');
        if (!overlay || !labels) return;

        overlay.innerHTML = '';
        labels.innerHTML = '';

        const positions = {
            'Library': { top: '28%', left: '22%' },
            'Classroom': { top: '28%', left: '72%' },
            'Lab': { top: '72%', left: '25%' },
            'ConferenceRoom': { top: '72%', left: '72%' }
        };

        Object.keys(positions).forEach(room => {
            const val = latestData[room] || 45;
            const pos = positions[room];
            const isCrit = val >= 70;
            const isWarn = val >= 60;

            let color = isCrit ? 'rgba(220, 38, 38, 0.8)' : (isWarn ? 'rgba(234, 179, 8, 0.7)' : 'rgba(16, 185, 129, 0.6)');

            const blob = document.createElement('div');
            blob.className = 'absolute w-64 h-64 rounded-full pointer-events-none transition-all duration-1000';
            blob.style.top = `calc(${pos.top} - 8rem)`;
            blob.style.left = `calc(${pos.left} - 8rem)`;
            blob.style.background = `radial-gradient(circle closest-side, ${color} 0%, rgba(0,0,0,0) 70%)`;
            blob.style.mixBlendMode = 'multiply';
            overlay.appendChild(blob);

            const label = document.createElement('div');
            label.className = `heatmap-marker px-3 py-1.5 rounded-xl shadow-lg border text-xs font-bold ${isCrit ? 'bg-red-600 text-white border-red-700 animate-bounce' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700'}`;
            label.style.top = pos.top;
            label.style.left = pos.left;
            label.innerHTML = `<span>${room}</span>: ${val} dB`;
            labels.appendChild(label);
        });
    },

    // --- LIVE TELEMETRY STREAM & REAL-TIME AUTO SIMULATION ---
    startTelemetryPolling() {
        if (this.pollingTimer) clearInterval(this.pollingTimer);

        const tick = async () => {
            try {
                // Generate realistic live micro-variations
                const randOffset = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                const lib = Math.max(35, 45 + randOffset(-6, 8));
                const cls = Math.max(40, 58 + randOffset(-8, 14));
                const lab = Math.max(38, 52 + randOffset(-5, 12));
                const conf = Math.max(42, 60 + randOffset(-7, 16));
                const avg = Math.round((lib + cls + lab + conf) / 4);

                // Send live telemetry to backend
                await api.noise.log({
                    Library: lib,
                    Classroom: cls,
                    Lab: lab,
                    ConferenceRoom: conf,
                    averageDecibel: avg,
                    deviceId: 'SILENTALERT_LIVE_STREAM'
                });

                // Update heatmap if visible
                this.updateHeatmap({ Library: lib, Classroom: cls, Lab: lab, ConferenceRoom: conf });

                // Update live cards if dashboard overview is active
                if (this.currentPage === 'dashboard') {
                    this.loadDashboardZoneCards();
                }
            } catch (err) {
                // background telemetry
            }
        };

        tick();
        this.pollingTimer = setInterval(tick, 3500);
        return;
    }
        if (this.pollingTimer) clearInterval(this.pollingTimer);

        const poll = async () => {
            try {
                const logs = await api.noise.getLogs(10);
                if (logs && logs.length > 0) {
                    const latest = logs[0];
                    this.updateHeatmap(latest);

                    // Check for critical violations across zones
                    const vals = [latest.Library, latest.Classroom, latest.Lab, latest.ConferenceRoom].filter(v => v);
                    const maxVal = Math.max(...vals);
                    const alertBox = document.getElementById('priority-alert-box');

                    if (maxVal >= 70) {
                        if (alertBox) {
                            alertBox.classList.remove('hidden');
                            alertBox.classList.add('flex');
                            const roomSpan = document.getElementById('alert-room-name');
                            const valSpan = document.getElementById('alert-db-val');
                            if (roomSpan) roomSpan.innerText = 'Monitored Zone';
                            if (valSpan) valSpan.innerText = maxVal;
                        }
                    } else if (alertBox) {
                        alertBox.classList.add('hidden');
                        alertBox.classList.remove('flex');
                    }
                }
            } catch (e) {
                // Background telemetry polling
            }
        };

        poll();
        this.pollingTimer = setInterval(poll, 3000);
    },

    // --- GLOBAL FORM SUBMISSION HANDLERS ---
    bindForms() {
        // Auth Forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', (e) => auth.handleLogin(e));

        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.addEventListener('submit', (e) => auth.handleRegister(e));

        const profileForm = document.getElementById('profile-form');
        if (profileForm) profileForm.addEventListener('submit', (e) => auth.handleProfileUpdate(e));

        const passwordForm = document.getElementById('password-form');
        if (passwordForm) passwordForm.addEventListener('submit', (e) => auth.handlePasswordChange(e));

        // Zone Form (Create / Edit)
        const zoneForm = document.getElementById('zone-form');
        if (zoneForm) zoneForm.addEventListener('submit', (e) => this.handleSaveZone(e));

        // Contact Form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('contact-name').value.trim();
                const email = document.getElementById('contact-email').value.trim();
                const subject = document.getElementById('contact-subject').value.trim();
                const message = document.getElementById('contact-message').value.trim();
                const submitBtn = document.getElementById('contact-submit-btn');

                if (!name || !email || !message) {
                    ui.toast('Please provide your name, email, and message.', 'warning');
                    return;
                }

                try {
                    ui.setLoading(submitBtn, true, 'Sending message...');
                    const res = await api.contact.submit({ name, email, subject, message });
                    ui.toast(res.message || 'Message sent! We will contact you shortly.', 'success');
                    contactForm.reset();
                } catch (err) {
                    ui.toast(err.message || 'Error sending message', 'error');
                } finally {
                    ui.setLoading(submitBtn, false);
                }
            });
        }

        // Newsletter / Incident Subscription Form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('newsletter-email').value;
                ui.toast(`Subscribed ${email} to acoustic violation alerts!`, 'success');
                newsletterForm.reset();
            });
        }

        // Explore Page Filter Listeners
        const searchInput = document.getElementById('explore-search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.exploreState.search = e.target.value.trim();
                    this.exploreState.page = 1;
                    this.loadExploreZones();
                }, 350);
            });
        }

        const categoryFilter = document.getElementById('explore-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.exploreState.category = e.target.value;
                this.exploreState.page = 1;
                this.loadExploreZones();
            });
        }

        const statusFilter = document.getElementById('explore-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.exploreState.status = e.target.value;
                this.exploreState.page = 1;
                this.loadExploreZones();
            });
        }

        const sortSelect = document.getElementById('explore-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.exploreState.sort = e.target.value;
                this.exploreState.page = 1;
                this.loadExploreZones();
            });
        }
    }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

