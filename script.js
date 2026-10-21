/**
 * SilentAlert Legacy Compatibility Wrapper
 * The application has been upgraded to a modular architecture located in /js/ and /server/.
 * This file forwards legacy invocations to the new modular subsystem.
 */

window.SilentAlert = {
    api: window.api,
    ui: window.ui,
    auth: window.auth,
    charts: window.charts,
    app: window.app
};

console.log("🚀 SilentAlert 2.0 Enterprise Engine Active");
