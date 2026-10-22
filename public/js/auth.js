/**
 * SilentAlert Authentication & User Management
 * Handles JWT tokens, login, registration, demo auto-fill credentials, and profile updates.
 */

const auth = {
    user: null,
    token: null,

    init() {
        this.token = localStorage.getItem('silentalert_token');
        const userJson = localStorage.getItem('silentalert_user');
        if (userJson) {
            try {
                this.user = JSON.parse(userJson);
            } catch (e) {
                this.user = null;
            }
        }

        this.updateNavState();

        // Listen for session expiration
        window.addEventListener('auth:expired', () => {
            this.logout('Your session has expired. Please log in again.');
        });
    },

    isAuthenticated() {
        return !!this.token && !!this.user;
    },

    isAdmin() {
        return this.user && this.user.role === 'admin';
    },

    setSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('silentalert_token', token);
        localStorage.setItem('silentalert_user', JSON.stringify(user));
        this.updateNavState();
    },

    logout(message = 'Logged out successfully') {
        this.token = null;
        this.user = null;
        localStorage.removeItem('silentalert_token');
        localStorage.removeItem('silentalert_user');
        if (window.firebaseAuth && typeof window.firebaseAuth.signOut === 'function') {
            window.firebaseAuth.signOut();
        }
        this.updateNavState();
        if (window.app && typeof window.app.showPage === 'function') {
            window.app.showPage('home');
        }
        ui.toast(message, 'info');
    },

    updateNavState() {
        const isAuth = this.isAuthenticated();
        const isAdmin = this.isAdmin();

        // Toggle visibility of auth-only vs guest-only elements
        document.querySelectorAll('.guest-only').forEach(el => {
            el.classList.toggle('hidden', isAuth);
        });

        document.querySelectorAll('.auth-only').forEach(el => {
            el.classList.toggle('hidden', !isAuth);
        });

        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
        });

        // Update profile displays in navbar and sidebar
        if (isAuth && this.user) {
            document.querySelectorAll('.user-name-display').forEach(el => {
                el.innerText = this.user.name || 'Acoustic Specialist';
            });
            document.querySelectorAll('.user-email-display').forEach(el => {
                el.innerText = this.user.email;
            });
            document.querySelectorAll('.user-role-badge').forEach(el => {
                el.innerText = (this.user.role || 'user').toUpperCase();
                if (this.user.role === 'admin') {
                    el.className = 'user-role-badge px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900';
                } else {
                    el.className = 'user-role-badge px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
                }
            });
            document.querySelectorAll('.user-avatar-display').forEach(el => {
                if (el.tagName === 'IMG') {
                    el.src = this.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                }
            });

            // Pre-fill profile page form
            const nameInput = document.getElementById('profile-name');
            const phoneInput = document.getElementById('profile-phone');
            const orgInput = document.getElementById('profile-org');
            const bioInput = document.getElementById('profile-bio');
            if (nameInput) nameInput.value = this.user.name || '';
            if (phoneInput) phoneInput.value = this.user.phone || '';
            if (orgInput) orgInput.value = this.user.organization || '';
            if (bioInput) bioInput.value = this.user.bio || '';
        }
    },

    // Handle Login Form Submission
    async handleLogin(e) {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const submitBtn = document.getElementById('login-submit-btn');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            ui.toast('Please fill in both email and password.', 'warning');
            return;
        }

        try {
            ui.setLoading(submitBtn, true, 'Signing in...');
            const res = await api.auth.login({ email, password });
            this.setSession(res.token, res.user);
            ui.toast(`Welcome back, ${res.user.name}!`, 'success');
            
            // Navigate to Dashboard
            if (window.app) window.app.showPage('dashboard');
        } catch (err) {
            ui.toast(err.message || 'Login failed. Please verify credentials.', 'error');
        } finally {
            ui.setLoading(submitBtn, false);
        }
    },

    // Handle Registration Form Submission
    async handleRegister(e) {
        e.preventDefault();
        const nameInput = document.getElementById('register-name');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');
        const roleSelect = document.getElementById('register-role');
        const submitBtn = document.getElementById('register-submit-btn');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const role = roleSelect ? roleSelect.value : 'user';

        if (!name || !email || !password) {
            ui.toast('Please complete all required fields.', 'warning');
            return;
        }

        if (password.length < 6) {
            ui.toast('Password must be at least 6 characters.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            ui.toast('Passwords do not match. Please verify.', 'warning');
            return;
        }

        try {
            ui.setLoading(submitBtn, true, 'Creating Account...');
            const res = await api.auth.register({ name, email, password, role });
            this.setSession(res.token, res.user);
            ui.toast('Registration complete! Welcome to SilentAlert.', 'success');
            if (window.app) window.app.showPage('dashboard');
        } catch (err) {
            ui.toast(err.message || 'Registration failed.', 'error');
        } finally {
            ui.setLoading(submitBtn, false);
        }
    },

    // Handle Demo Login Button Click
    async handleDemoLogin(role) {
        const btn = document.getElementById(`demo-login-${role}-btn`);
        try {
            ui.setLoading(btn, true, `Authenticating Demo ${role.toUpperCase()}...`);
            const res = await api.auth.demoLogin(role);
            this.setSession(res.token, res.user);
            ui.toast(`Logged in as Demo ${role.toUpperCase()}!`, 'success');
            if (window.app) window.app.showPage('dashboard');
        } catch (err) {
            ui.toast(`Demo login error: ${err.message}`, 'error');
        } finally {
            ui.setLoading(btn, false);
        }
    },

    // Auto-fill form fields with demo credentials for user visibility
    fillDemoCredentials(role) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        if (emailInput && passwordInput) {
            if (role === 'admin') {
                emailInput.value = 'admin@silentalert.io';
                passwordInput.value = 'Admin@1234';
            } else {
                emailInput.value = 'user@silentalert.io';
                passwordInput.value = 'User@1234';
            }
            ui.toast(`Filled Demo ${role.toUpperCase()} credentials`, 'info');
        }
    },

    // Handle Profile Form Submission
    async handleProfileUpdate(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value.trim();
        const phone = document.getElementById('profile-phone').value.trim();
        const organization = document.getElementById('profile-org').value.trim();
        const bio = document.getElementById('profile-bio').value.trim();
        const submitBtn = document.getElementById('profile-submit-btn');

        try {
            ui.setLoading(submitBtn, true, 'Saving Profile...');
            const res = await api.auth.updateProfile({ name, phone, organization, bio });
            this.user = { ...this.user, ...res.user };
            localStorage.setItem('silentalert_user', JSON.stringify(this.user));
            this.updateNavState();
            ui.toast('Profile details updated successfully!', 'success');
        } catch (err) {
            ui.toast(err.message || 'Error updating profile', 'error');
        } finally {
            ui.setLoading(submitBtn, false);
        }
    },

    // Handle Password Change Form Submission
    async handlePasswordChange(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        const submitBtn = document.getElementById('password-submit-btn');

        if (newPassword.length < 6) {
            ui.toast('New password must be at least 6 characters.', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            ui.toast('New passwords do not match.', 'warning');
            return;
        }

        try {
            ui.setLoading(submitBtn, true, 'Updating Password...');
            await api.auth.updatePassword({ currentPassword, newPassword });
            ui.toast('Password updated successfully! Please keep it secure.', 'success');
            document.getElementById('password-form').reset();
        } catch (err) {
            ui.toast(err.message || 'Error changing password', 'error');
        } finally {
            ui.setLoading(submitBtn, false);
        }
    }
};

window.auth = auth;

