/**
 * SilentAlert - Firebase Initialization & Authentication Service
 * Connects directly to project: silentalert-6a832
 */

const firebaseConfig = {
    apiKey: "AIzaSyBZVa9hr1BrSQi9V1CPw8AMXamRNtFDvgo",
    authDomain: "silentalert-6a832.firebaseapp.com",
    projectId: "silentalert-6a832",
    storageBucket: "silentalert-6a832.firebasestorage.app",
    messagingSenderId: "1023567047353",
    appId: "1:1023567047353:web:6d5925795e2c5c26f30968",
    measurementId: "G-NE8G3FVPXW"
};

// Initialize Firebase App
let fbApp = null;
let fbAuth = null;
let fbAnalytics = null;

try {
    if (typeof firebase !== 'undefined') {
        fbApp = firebase.initializeApp(firebaseConfig);
        fbAuth = firebase.auth();
        try {
            if (typeof firebase.analytics === 'function') {
                fbAnalytics = firebase.analytics();
            }
        } catch (e) {
            // Analytics optional in local dev
        }
        console.log("🔥 Firebase Initialized: silentalert-6a832");
    }
} catch (err) {
    console.error("Firebase init error:", err.message);
}

const firebaseAuth = {
    // 1. Google Sign-In with Firebase Popup
    async signInWithGoogle() {
        if (!fbAuth) {
            ui.toast("Firebase SDK is not ready yet. Please refresh the page.", "error");
            return;
        }

        const btn = document.getElementById('google-signin-btn') || document.getElementById('google-signup-btn');
        try {
            ui.setLoading(btn, true, 'Connecting to Google...');
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');

            const result = await fbAuth.signInWithPopup(provider);
            const fbUser = result.user;
            const idToken = await fbUser.getIdToken();

            // Sync with SilentAlert Backend API
            const syncRes = await api.auth.firebaseSync({
                uid: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName || fbUser.email.split('@')[0],
                avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                idToken
            });

            // Store session
            auth.setSession(syncRes.token, syncRes.user);
            ui.toast(`Welcome, ${syncRes.user.name}! Signed in via Google.`, 'success');

            // Open Dashboard
            if (window.app) window.app.showPage('dashboard');
        } catch (error) {
            console.error("Google Auth Error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                ui.toast("Google sign-in popup was closed.", "info");
            } else if (error.code === 'auth/operation-not-allowed') {
                ui.toast("Google Sign-In is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.", "warning");
            } else {
                ui.toast(error.message || "Failed to sign in with Google", "error");
            }
        } finally {
            ui.setLoading(btn, false);
        }
    },

    // 2. Firebase Email & Password Login
    async signInWithEmail(email, password) {
        if (!fbAuth) throw new Error("Firebase Auth not initialized");
        const userCredential = await fbAuth.signInWithEmailAndPassword(email, password);
        const fbUser = userCredential.user;
        const idToken = await fbUser.getIdToken();

        const syncRes = await api.auth.firebaseSync({
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            avatar: fbUser.photoURL,
            idToken
        });

        auth.setSession(syncRes.token, syncRes.user);
        return syncRes;
    },

    // 3. Firebase Email & Password Registration
    async registerWithEmail(email, password, name) {
        if (!fbAuth) throw new Error("Firebase Auth not initialized");
        const userCredential = await fbAuth.createUserWithEmailAndPassword(email, password);
        const fbUser = userCredential.user;

        if (name && fbUser.updateProfile) {
            await fbUser.updateProfile({ displayName: name });
        }

        const idToken = await fbUser.getIdToken();
        const syncRes = await api.auth.firebaseSync({
            uid: fbUser.uid,
            email: fbUser.email,
            name: name || fbUser.email.split('@')[0],
            avatar: fbUser.photoURL,
            idToken
        });

        auth.setSession(syncRes.token, syncRes.user);
        return syncRes;
    },

    // 4. Sign Out
    async signOut() {
        if (fbAuth && fbAuth.currentUser) {
            try {
                await fbAuth.signOut();
            } catch (e) {}
        }
    }
};

window.firebaseAuth = firebaseAuth;

