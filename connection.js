/**
 * ConnectionManager
 * Handles server health monitoring and API configuration.
 */
class ConnectionManager {
    constructor() {
        this.apiBaseUrl = localStorage.getItem('lga_api_url') || '';
        this.status = 'unknown'; // 'online' | 'offline' | 'unknown'
        this.listeners = [];
        this.checkInterval = 5000; // 5 seconds
        this.timer = null;
    }

    get baseUrl() {
        return this.apiBaseUrl;
    }

    set baseUrl(url) {
        this.apiBaseUrl = url;
        localStorage.setItem('lga_api_url', url);
        this.checkStatus();
    }

    onStatusChange(callback) {
        this.listeners.push(callback);
    }

    async checkStatus() {
        try {
            const res = await fetch(`${this.apiBaseUrl}/api/health`, { cache: 'no-store' });
            if (res.ok) {
                this.updateStatus('online');
            } else {
                this.updateStatus('offline');
            }
        } catch (e) {
            this.updateStatus('offline');
        }
    }

    updateStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.listeners.forEach(cb => cb(newStatus));
        }
    }

    startMonitoring() {
        this.checkStatus();
        this.timer = setInterval(() => this.checkStatus(), this.checkInterval);
    }

    stopMonitoring() {
        if (this.timer) clearInterval(this.timer);
    }

    /**
     * Helper to perform fetch with the base URL
     */
    async apiFetch(path, options = {}) {
        const url = `${this.apiBaseUrl}${path}`;
        try {
            const response = await fetch(url, options);
            if (response.status === 401 && !window.location.href.includes('landing.html')) {
                // Auto logout on session expiry
                localStorage.removeItem('lga_user');
                window.location.href = 'landing.html';
            }
            return response;
        } catch (e) {
            this.updateStatus('offline');
            throw e;
        }
    }
}

// Global instance
window.LgaConnection = new ConnectionManager();
window.LgaConnection.startMonitoring();
