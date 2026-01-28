/**
 * BaokimOrder - API đơn hàng (Basic Pro)
 */

const Config = require('./Config');
const HttpClient = require('./HttpClient');
const SignatureHelper = require('./SignatureHelper');
const ErrorCode = require('./ErrorCode');

// Endpoints
const ENDPOINT_CREATE_ORDER = '/b2b/core/api/ext/mm/order/send';
const ENDPOINT_QUERY_ORDER = '/b2b/core/api/ext/mm/order/get-order';
const ENDPOINT_REFUND_ORDER = '/b2b/core/api/ext/mm/refund/send';
const ENDPOINT_CANCEL_AUTO_DEBIT = '/b2b/core/api/ext/mm/autodebit/cancel';

// Payment methods
const PAYMENT_METHOD = {
    VA: 1,
    VNPAY_QR: 6,
    AUTO_DEBIT: 22
};

class BaokimOrder {
    constructor(auth) {
        this.auth = auth;
        this.httpClient = new HttpClient();
    }

    /**
     * Tạo đơn hàng mới
     * @param {object} orderData 
     * @returns {Promise<object>}
     */
    async createOrder(orderData) {
        const requestBody = {
            request_id: this.generateRequestId(),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            mrc_order_id: orderData.mrcOrderId,
            total_amount: parseInt(orderData.totalAmount),
            description: orderData.description,
            url_success: orderData.urlSuccess || Config.get('urlSuccess'),
            url_fail: orderData.urlFail || Config.get('urlFail'),
        };

        // Optional fields
        if (orderData.paymentMethod) {
            requestBody.payment_method = parseInt(orderData.paymentMethod);
        }
        if (orderData.items) {
            requestBody.items = orderData.items;
        }
        if (orderData.customerInfo) {
            requestBody.customer_info = orderData.customerInfo;
        }

        // Auto debit fields
        ['serviceCode', 'saveToken', 'storeCode', 'branchCode', 'staffCode'].forEach(field => {
            const snakeCase = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (orderData[field] !== undefined) {
                requestBody[snakeCase] = orderData[field];
            }
        });

        return this.sendRequest(ENDPOINT_CREATE_ORDER, requestBody);
    }

    /**
     * Tra cứu đơn hàng
     * @param {string} mrcOrderId 
     * @returns {Promise<object>}
     */
    async queryOrder(mrcOrderId) {
        const requestBody = {
            request_id: this.generateRequestId(),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            mrc_order_id: mrcOrderId,
        };

        return this.sendRequest(ENDPOINT_QUERY_ORDER, requestBody);
    }

    /**
     * Hoàn tiền đơn hàng
     * @param {string} mrcOrderId 
     * @param {number} amount 
     * @param {string} description 
     * @returns {Promise<object>}
     */
    async refundOrder(mrcOrderId, amount, description = 'Refund') {
        const requestBody = {
            request_id: this.generateRequestId(),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            mrc_order_id: mrcOrderId,
            amount: parseInt(amount),
            description: description,
        };

        return this.sendRequest(ENDPOINT_REFUND_ORDER, requestBody);
    }

    /**
     * Hủy thu hộ tự động
     * @param {string} token - Token từ webhook
     * @param {string} urlSuccess 
     * @param {string} urlFail 
     * @returns {Promise<object>}
     */
    async cancelAutoDebit(token, urlSuccess = null, urlFail = null) {
        const requestBody = {
            request_id: this.generateRequestId(),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            url_success: urlSuccess || Config.get('urlSuccess'),
            url_fail: urlFail || Config.get('urlFail'),
            token: token,
        };

        return this.sendRequest(ENDPOINT_CANCEL_AUTO_DEBIT, requestBody);
    }

    /**
     * Gửi request tới Baokim API
     */
    async sendRequest(endpoint, requestBody) {
        const jsonBody = JSON.stringify(requestBody);
        const signature = SignatureHelper.sign(jsonBody);
        const authHeader = await this.auth.getAuthorizationHeader();

        const response = await this.httpClient.post(endpoint, requestBody, {
            'Authorization': authHeader,
            'Signature': signature
        });

        if (!response.success) {
            throw new Error(`API request failed: ${response.error}`);
        }

        const data = response.data;
        const code = data.code;

        return {
            success: ErrorCode.isSuccess(code),
            code: code,
            message: data.message || '',
            data: data.data || null,
            rawResponse: data,
        };
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `${Config.get('subMerchantCode')}_${this.formatDateTime().replace(/[- :]/g, '')}_${Math.random().toString(16).substr(2, 8)}`;
    }

    /**
     * Format datetime (Vietnam timezone +07:00)
     */
    formatDateTime() {
        const now = new Date();
        // Adjust to Vietnam timezone (+07:00)
        const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return vnTime.toISOString().replace('T', ' ').substr(0, 19);
    }

    /**
     * Build customer info
     */
    static buildCustomerInfo(name, email, phone, address = '', gender = 1) {
        return { name, email, phone, address, gender };
    }
}

// Export payment methods
BaokimOrder.PAYMENT_METHOD = PAYMENT_METHOD;

module.exports = BaokimOrder;
