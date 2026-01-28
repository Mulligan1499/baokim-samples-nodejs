/**
 * Logger - Ghi log request/response
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.enabled = true;

        // Tạo thư mục logs nếu chưa có
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Lấy đường dẫn log file theo ngày
     */
    getLogFile(prefix = 'api') {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${prefix}_${date}.log`);
    }

    /**
     * Ghi log
     */
    log(level, message, context = {}) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
        const contextStr = Object.keys(context).length > 0
            ? '\n' + JSON.stringify(context, null, 2)
            : '';

        const logLine = `[${timestamp}] [${level}] ${message}${contextStr}\n${'─'.repeat(80)}\n`;

        fs.appendFileSync(this.getLogFile(), logLine);
    }

    /**
     * Log request
     */
    logRequest(method, url, headers = {}, body = null) {
        this.log('INFO', `REQUEST: ${method} ${url}`, {
            headers: this.sanitizeHeaders(headers),
            body
        });
    }

    /**
     * Log response
     */
    logResponse(httpCode, body, duration = null) {
        const msg = duration
            ? `RESPONSE: HTTP ${httpCode} (${duration}ms)`
            : `RESPONSE: HTTP ${httpCode}`;
        this.log('INFO', msg, { body });
    }

    /**
     * Log error
     */
    error(message, context = {}) {
        this.log('ERROR', message, context);
    }

    /**
     * Log info
     */
    info(message, context = {}) {
        this.log('INFO', message, context);
    }

    /**
     * Ẩn sensitive data trong headers
     */
    sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        if (sanitized['Authorization']) {
            sanitized['Authorization'] = sanitized['Authorization'].substr(0, 50) + '...';
        }
        return sanitized;
    }
}

module.exports = new Logger();
