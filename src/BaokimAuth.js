/**
 * BaokimAuth - Xác thực OAuth2
 */

const Config = require('./Config');
const HttpClient = require('./HttpClient');
const SignatureHelper = require('./SignatureHelper');

const ENDPOINT_GET_TOKEN = '/b2b/auth-service/api/oauth/get-token';

class BaokimAuth {
    constructor() {
        this.httpClient = new HttpClient();
        this.token = null;
        this.tokenExpiresAt = null;
    }

    /**
     * Lấy access token (có cache)
     * @param {boolean} forceRefresh - Bắt buộc lấy token mới
     * @returns {Promise<string>}
     */
    async getToken(forceRefresh = false) {
        // Kiểm tra cache
        if (!forceRefresh && this.isTokenValid()) {
            return this.token;
        }

        // Gọi API lấy token mới
        const requestBody = {
            merchant_code: Config.get('masterMerchantCode'),
            client_id: Config.get('clientId'),
            client_secret: Config.get('clientSecret')
        };

        const jsonBody = JSON.stringify(requestBody);
        const signature = SignatureHelper.sign(jsonBody);

        const response = await this.httpClient.post(ENDPOINT_GET_TOKEN, requestBody, {
            'Signature': signature
        });

        if (!response.success) {
            throw new Error(`Failed to get token: ${response.error}`);
        }

        const data = response.data;

        if (data.code !== 100 || !data.data || !data.data.access_token) {
            throw new Error(`Token API error: ${data.message || 'Unknown error'}`);
        }

        // Cache token
        this.token = data.data.access_token;
        this.tokenExpiresAt = new Date(data.data.expires_at).getTime();

        return this.token;
    }

    /**
     * Kiểm tra token còn hiệu lực không
     * @returns {boolean}
     */
    isTokenValid() {
        if (!this.token || !this.tokenExpiresAt) {
            return false;
        }
        // Buffer 60 giây trước khi hết hạn
        return Date.now() < (this.tokenExpiresAt - 60000);
    }

    /**
     * Lấy Authorization header
     * @returns {Promise<string>}
     */
    async getAuthorizationHeader() {
        const token = await this.getToken();
        return `Bearer ${token}`;
    }
}

module.exports = BaokimAuth;
