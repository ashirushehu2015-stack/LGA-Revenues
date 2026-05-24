/**
 * LGA RevMax SMS Helper Module
 * Handles automated notifications for taxpayers and admins using SQLite for unified storage.
 */

const { dbQuery } = require('./db');

const smsHelper = {
    /**
     * Send an SMS notification and save it to SQLite.
     * @param {string} to - Recipient phone number
     * @param {string} message - Message content
     * @param {string} type - Notification type (Registration, Payment, Reminder)
     */
    send: async (to, message, type = 'Notification') => {
        console.log(`[SMS] Sending to ${to}: ${message}`);

        const timestamp = new Date().toISOString();
        const status = 'Delivered'; // Simulated

        try {
            await dbQuery.run(
                `INSERT INTO sms_notifications (to_phone, message, type, timestamp, status) VALUES (?, ?, ?, ?, ?)`,
                [to, message, type, timestamp, status]
            );
            return { success: true };
        } catch (err) {
            console.error('[SMS Error]', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get recent notifications from SQLite (Newest first, capped at 500)
     */
    getLogs: async () => {
        try {
            const rows = await dbQuery.all(`
                SELECT to_phone as "to", message, type, timestamp, status 
                FROM sms_notifications 
                ORDER BY id DESC 
                LIMIT 500
            `);
            return rows;
        } catch (err) {
            console.error('[SMS Get Logs Error]', err);
            return [];
        }
    }
};

module.exports = smsHelper;
