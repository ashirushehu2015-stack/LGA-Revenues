/**
 * LGA RevMax SMS Helper Module
 * Handles automated notifications for taxpayers and admins.
 * Supports simulation mode and external API integration (Termii/Twilio).
 */

const fs = require('fs');
const path = require('path');

const SMS_LOG_FILE = path.join(__dirname, 'data', 'sms_notifications.json');

// Ensure data directory and log file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(SMS_LOG_FILE)) {
    fs.writeFileSync(SMS_LOG_FILE, JSON.stringify([], null, 2));
}

const smsHelper = {
    /**
     * Send an SMS notification
     * @param {string} to - Recipient phone number
     * @param {string} message - Message content
     * @param {string} type - Notification type (Registration, Payment, Reminder)
     */
    send: async (to, message, type = 'Notification') => {
        console.log(`[SMS] Sending to ${to}: ${message}`);

        const notification = {
            id: Date.now(),
            to,
            message,
            type,
            timestamp: new Date().toISOString(),
            status: 'Delivered' // Simulated
        };

        try {
            const logs = JSON.parse(fs.readFileSync(SMS_LOG_FILE));
            logs.unshift(notification); // Newest first
            fs.writeFileSync(SMS_LOG_FILE, JSON.stringify(logs.slice(0, 500), null, 2)); // Keep last 500
            
            // Here you would normally integrate with an API like Termii:
            // await axios.post('https://api.ng.termii.com/api/sms/send', { ... });
            
            return { success: true, ref: notification.id };
        } catch (err) {
            console.error('[SMS Error]', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get recent notifications
     */
    getLogs: () => {
        try {
            return JSON.parse(fs.readFileSync(SMS_LOG_FILE));
        } catch (err) {
            return [];
        }
    }
};

module.exports = smsHelper;
