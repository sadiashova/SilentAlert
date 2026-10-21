/**
 * SilentAlert UI System
 * Theme switching, Toast notifications, Modal manager, and Animation controllers.
 */

const ui = {
    // --- THEME MANAGEMENT (LIGHT / DARK MODE) ---
    initTheme() {
        const savedTheme = localStorage.getItem('silentalert_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
            this.updateThemeIcons(true);
        } else {
            document.documentElement.classList.remove('dark');
            this.updateThemeIcons(false);
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('silentalert_theme', isDark ? 'dark' : 'light');
        this.updateThemeIcons(isDark);
        ui.toast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
        // Redraw charts with adapted colors
        if (window.charts && typeof window.charts.refreshTheme === 'function') {
            window.charts.refreshTheme(isDark);
        }
    },

    updateThemeIcons(isDark) {
        document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun', 'text-amber-400');
            } else {
                icon.classList.remove('fa-sun', 'text-amber-400');
                icon.classList.add('fa-moon', 'text-slate-700');
            }
        });
    },

    // --- TOAST NOTIFICATIONS ---
    toast(message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: 'fa-check-circle text-emerald-500',
            error: 'fa-exclamation-circle text-red-500',
            warning: 'fa-exclamation-triangle text-amber-500',
            info: 'fa-info-circle text-blue-500'
        };

        const bgBorders = {
            success: 'border-emerald-500 bg-white dark:bg-slate-900',
            error: 'border-red-500 bg-white dark:bg-slate-900',
            warning: 'border-amber-500 bg-white dark:bg-slate-900',
            info: 'border-blue-500 bg-white dark:bg-slate-900'
        };

        const toast = document.createElement('div');
        toast.className = `toast-item flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${bgBorders[type]} max-w-md pointer-events-auto`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} text-xl shrink-0"></i>
            <span class="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">${message}</span>
            <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i class="fas fa-times text-xs"></i>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // --- MODAL CONTROLLER ---
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }
    },

    // --- BUTTON LOADING STATE ---
    setLoading(button, isLoading, loadingText = 'Processing...') {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalHtml = button.innerHTML;
            button.disabled = true;
            button.classList.add('opacity-75', 'cursor-not-allowed');
            button.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ${loadingText}
            `;
        } else {
            button.disabled = false;
            button.classList.remove('opacity-75', 'cursor-not-allowed');
            if (button.dataset.originalHtml) {
                button.innerHTML = button.dataset.originalHtml;
            }
        }
    },

    // --- SKELETON LOADERS ---
    renderCardSkeletons(containerId, count = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonsHtml = '';
        for (let i = 0; i < count; i++) {
            skeletonsHtml += `
                <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full animate-pulse">
                    <div class="w-full h-44 rounded-xl skeleton mb-4"></div>
                    <div class="flex justify-between items-center mb-3">
                        <div class="h-4 w-20 skeleton rounded-full"></div>
                        <div class="h-4 w-12 skeleton rounded-full"></div>
                    </div>
                    <div class="h-6 w-3/4 skeleton rounded-lg mb-2"></div>
                    <div class="h-4 w-full skeleton rounded mb-4"></div>
                    <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div class="h-8 w-16 skeleton rounded-lg"></div>
                        <div class="h-9 w-24 skeleton rounded-xl"></div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = skeletonsHtml;
    },

    // --- INTERACTIVE WAVEFORM SIMULATOR ---
    initWaveformSimulator() {
        const container = document.getElementById('hero-waveform-container');
        const slider = document.getElementById('sound-intensity-slider');
        const dbDisplay = document.getElementById('hero-db-display');
        const statusDisplay = document.getElementById('hero-db-status');

        if (!container) return;

        container.innerHTML = '';
        const barCount = 32;
        const bars = [];

        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            bar.style.height = '12px';
            container.appendChild(bar);
            bars.push(bar);
        }

        let baseVal = slider ? parseInt(slider.value, 10) : 48;

        const updateBars = () => {
            bars.forEach((bar, idx) => {
                const distance = Math.abs(idx - barCount / 2) / (barCount / 2);
                const noise = Math.random() * 0.4 + 0.6;
                const heightPercent = Math.max(8, (baseVal * (1 - distance * 0.5) * noise));
                bar.style.height = `${Math.min(heightPercent, 96)}%`;

                if (baseVal >= 70) {
                    bar.style.backgroundColor = '#ef4444'; // Red
                } else if (baseVal >= 60) {
                    bar.style.backgroundColor = '#f59e0b'; // Amber
                } else {
                    bar.style.backgroundColor = '#10b981'; // Green
                }
            });
        };

        if (slider) {
            slider.addEventListener('input', (e) => {
                baseVal = parseInt(e.target.value, 10);
                if (dbDisplay) dbDisplay.innerText = `${baseVal} dB`;
                if (statusDisplay) {
                    if (baseVal >= 70) {
                        statusDisplay.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-exclamation-triangle"></i> CRITICAL VIOLATION</span>`;
                    } else if (baseVal >= 60) {
                        statusDisplay.innerHTML = `<span class="text-amber-500 font-bold"><i class="fas fa-exclamation-circle"></i> MODERATE WARNING</span>`;
                    } else {
                        statusDisplay.innerHTML = `<span class="text-emerald-500 font-bold"><i class="fas fa-check-circle"></i> QUIET COMPLIANT</span>`;
                    }
                }
                updateBars();
            });
        }

        setInterval(updateBars, 150);
    }
};

window.ui = ui;
