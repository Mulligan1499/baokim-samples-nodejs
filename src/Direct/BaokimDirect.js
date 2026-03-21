/**
 * BaokimDirect - API Direct Connection (không qua Master Merchant)
 */

const Config = require('../Config');
const HttpClient = require('../HttpClient');
const SignatureHelper = require('../SignatureHelper');
const ErrorCode = require('../ErrorCode');

// Endpoints
const ENDPOINT_CREATE_ORDER = '/b2b/core/api/ext/order/send';
const ENDPOINT_QUERY_ORDER = '/b2b/core/api/ext/order/get-order';
const ENDPOINT_REFUND_ORDER = '/b2b/core/api/ext/refund/send';
const ENDPOINT_CANCEL_ORDER = '/b2b/core/api/ext/order/cancel';

// Payment methods
const PAYMENT_METHOD = {
    VA: 1,           // Virtual Account
    BNPL: 2,         // Buy Now Pay Later
    CREDIT_CARD: 3,  // Thẻ tín dụng
    ATM: 4,          // Thẻ ATM nội địa
    QR_PAY: 6,       // VNPay QR
};

class BaokimDirect {
    constructor(token) {
        this.token = token;
        this.httpClient = new HttpClient();
    }

    /**
     * Tạo đơn hàng Direct
     * @param {object} orderData 
     * @returns {Promise<object>}
     */
    async createOrder(orderData) {
        // Validate required fields
        const requiredFields = ['mrcOrderId', 'totalAmount', 'description'];
        for (const field of requiredFields) {
            if (!orderData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Chuẩn bị request body - CHỈ required fields
        const requestBody = {
            request_id: String(Date.now()) + Math.floor(Math.random() * 1000),
            request_time: this.formatDateTime(),
            merchant_code: Config.get('directMerchantCode') || Config.get('merchantCode'),
            mrc_order_id: orderData.mrcOrderId,
            description: orderData.description,
            total_amount: parseInt(orderData.totalAmount),
            url_success: orderData.urlSuccess || Config.get('urlSuccess'),
            url_fail: orderData.urlFail || Config.get('urlFail'),
        };

        // Thêm optional fields CHỈ KHI có giá trị (không empty)
        // QUAN TRỌNG: Empty strings gây lỗi signature!
        if (orderData.storeCode) {
            requestBody.store_code = orderData.storeCode;
        }
        if (orderData.branchCode) {
            requestBody.branch_code = orderData.branchCode;
        }
        if (orderData.staffCode) {
            requestBody.staff_code = orderData.staffCode;
        }

        // Items
        if (orderData.items && Array.isArray(orderData.items)) {
            requestBody.items = orderData.items;
        }

        // Customer info - required theo Baokim
        const customerInfo = orderData.customerInfo || {};
        requestBody.customer_info = {
            name: customerInfo.name || 'NGUYEN VAN A',
            email: customerInfo.email || 'test@example.com',
            phone: customerInfo.phone || '0901234567',
            address: customerInfo.address || '123 Test',
            gender: customerInfo.gender !== undefined ? customerInfo.gender : 1,
        };
        // Thêm customer code nếu có
        if (customerInfo.code) {
            requestBody.customer_info.code = customerInfo.code;
        }

        // Payment method
        if (orderData.paymentMethod !== undefined) {
            requestBody.payment_method = String(orderData.paymentMethod);
        }

        return this.sendRequest(ENDPOINT_CREATE_ORDER, requestBody);
    }

    /**
     * Tra cứu đơn hàng
     * @param {string} mrcOrderId 
     * @returns {Promise<object>}
     */
    async queryOrder(mrcOrderId) {
        if (!mrcOrderId) {
            throw new Error('Missing required field: mrcOrderId');
        }

        const requestBody = {
            request_id: this.generateRequestId('QRY'),
            request_time: this.formatDateTime(),
            merchant_code: Config.get('directMerchantCode') || Config.get('merchantCode'),
            mrc_order_id: mrcOrderId,
        };

        return this.sendRequest(ENDPOINT_QUERY_ORDER, requestBody);
    }

    /**
     * Hủy đơn hàng
     * @param {string} mrcOrderId 
     * @param {string} reason 
     * @returns {Promise<object>}
     */
    async cancelOrder(mrcOrderId, reason = '') {
        if (!mrcOrderId) {
            throw new Error('Missing required field: mrcOrderId');
        }

        const requestBody = {
            request_id: this.generateRequestId('CANCEL'),
            request_time: this.formatDateTime(),
            merchant_code: Config.get('directMerchantCode') || Config.get('merchantCode'),
            mrc_order_id: mrcOrderId,
        };

        // Chỉ thêm reason nếu có giá trị
        if (reason) {
            requestBody.reason = reason;
        }

        return this.sendRequest(ENDPOINT_CANCEL_ORDER, requestBody);
    }

    /**
     * Hoàn tiền đơn hàng
     * @param {string} mrcOrderId Mã đơn hàng của Merchant
     * @param {string} description Lý do hoàn tiền (required)
     * @param {number|null} amount Số tiền hoàn (null = hoàn toàn bộ)
     * @param {string|null} accountNo Số tài khoản nhận tiền hoàn (optional, required nếu gặp lỗi 116)
     * @param {string|null} bankNo Mã ngân hàng nhận tiền hoàn (optional, required nếu gặp lỗi 116)
     * @returns {Promise<object>}
     */
    async refundOrder(mrcOrderId, description, amount = null, accountNo = null, bankNo = null) {
        // Validate required fields
        if (!mrcOrderId) {
            throw new Error('Missing required field: mrcOrderId');
        }
        if (!description) {
            throw new Error('Missing required field: description');
        }

        // Chuẩn bị request body với tất cả các trường
        const requestBody = {
            // === REQUIRED FIELDS ===
            request_id: String(Date.now()) + Math.floor(Math.random() * 1000),
            request_time: this.formatDateTime(),
            merchant_code: Config.get('directMerchantCode') || Config.get('merchantCode'),
            mrc_order_id: mrcOrderId,
            description: description,
        };

        // === OPTIONAL FIELDS ===
        // Chỉ thêm khi có giá trị, tránh lỗi validation từ API
        if (amount !== null && amount !== undefined) {
            requestBody.amount = parseInt(amount);
        }
        if (accountNo) {
            requestBody.account_no = accountNo;
        }
        if (bankNo) {
            requestBody.bank_no = bankNo;
        }

        return this.sendRequest(ENDPOINT_REFUND_ORDER, requestBody);
    }

    /**
     * Gửi request tới Baokim API
     */
    async sendRequest(endpoint, requestBody) {
        // Encode JSON một lần duy nhất
        const jsonBody = JSON.stringify(requestBody);
        const signature = SignatureHelper.sign(jsonBody);
        const authHeader = 'Bearer ' + this.token;

        // Gửi request với JSON đã ký (dùng postRaw để không re-encode)
        const response = await this.httpClient.postRaw(endpoint, jsonBody, {
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
     * Note: Baokim dùng merchant_code trong request_id để thống kê và gửi thông báo cập nhật SDK.
     * Vui lòng giữ nguyên format này.
     */
    generateRequestId(prefix = 'DRT') {
        const merchantCode = Config.get('directMerchantCode') || Config.get('merchantCode');
        return `${merchantCode}_${prefix}_${this.formatDateTime().replace(/[- :]/g, '')}_${Math.random().toString(16).substr(2, 8)}`;
    }

    /**
     * Format datetime (Vietnam timezone +07:00)
     */
    formatDateTime() {
        const now = new Date();
        const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return vnTime.toISOString().replace('T', ' ').substr(0, 19);
    }
}

// Export payment methods
BaokimDirect.PAYMENT_METHOD = PAYMENT_METHOD;

// Static helper to build customer info
BaokimDirect.buildCustomerInfo = function (name, email, phone, address) {
    return {
        name: name,
        email: email,
        phone: phone,
        address: address,
        gender: 1
    };
};

module.exports = BaokimDirect;
