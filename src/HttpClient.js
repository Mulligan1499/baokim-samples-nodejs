/**
 * HttpClient - HTTP Client với logging
 * Sử dụng native fetch (Node.js 18+)
 */

const Config = require('./Config');
const Logger = require('./Logger');
const SignatureHelper = require('./SignatureHelper');

class HttpClient {
    constructor() {
        this.baseUrl = Config.get('baseUrl');
        this.timeout = Config.get('timeout', 30000);
    }

    /**
     * Gửi request POST với JSON body
     * @param {string} endpoint 
     * @param {object} body 
     * @param {object} headers 
     * @returns {Promise<object>}
     */
    async post(endpoint, body = {}, headers = {}) {
        return this.request('POST', endpoint, body, headers);
    }

    /**
     * Gửi request GET
     * @param {string} endpoint 
     * @param {object} headers 
     * @returns {Promise<object>}
     */
    async get(endpoint, headers = {}) {
        return this.request('GET', endpoint, null, headers);
    }

    /**
     * Gửi request chung
     */
    async request(method, endpoint, body = null, customHeaders = {}) {
        const url = this.buildUrl(endpoint);
        const jsonBody = body ? JSON.stringify(body) : null;

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...customHeaders
        };

        // Log request
        Logger.logRequest(method, url, headers, body);

        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method,
                headers,
                body: jsonBody,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const duration = Date.now() - startTime;
            const responseData = await response.json();

            // Log response
            Logger.logResponse(response.status, responseData, duration);

            return {
                success: response.ok,
                httpCode: response.status,
                data: responseData,
                error: response.ok ? null : this.extractError(responseData, response.status)
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.error(`Request failed: ${error.message}`, { url, duration });

            return {
                success: false,
                httpCode: 0,
                data: null,
                error: error.message
            };
        }
    }

    /**
     * Build full URL
     */
    buildUrl(endpoint) {
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        return this.baseUrl + endpoint;
    }

    /**
     * Trích xuất error message
     */
    extractError(data, httpCode) {
        if (data && data.message) {
            return data.message;
        }
        return `HTTP Error ${httpCode}`;
    }
}

module.exports = HttpClient;
