/**
 * BaokimVA - API Virtual Account (Host to Host)
 */

const Config = require('./Config');
const HttpClient = require('./HttpClient');
const SignatureHelper = require('./SignatureHelper');
const ErrorCode = require('./ErrorCode');

// Endpoints
const ENDPOINT_CREATE_VA = '/b2b/core/api/ext/mm/bank-transfer/create';
const ENDPOINT_UPDATE_VA = '/b2b/core/api/ext/mm/bank-transfer/update';
const ENDPOINT_QUERY_TRANSACTION = '/b2b/core/api/ext/mm/bank-transfer/detail';
const ENDPOINT_REFUND = '/b2b/core/api/ext/mm/refund/send';

// VA Types
const VA_TYPE = {
    DYNAMIC: 1,  // VA động - 1 lần dùng
    STATIC: 2    // VA tĩnh - nhiều lần dùng
};

class BaokimVA {
    constructor(auth) {
        this.auth = auth;
        this.httpClient = new HttpClient();
    }

    /**
     * Tạo VA mới
     * @param {object} vaData 
     * @returns {Promise<object>}
     */
    async createVA(vaData) {
        const requestBody = {
            request_id: this.generateRequestId('VA'),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            acc_name: vaData.accName,
            acc_type: parseInt(vaData.accType || VA_TYPE.DYNAMIC),
            mrc_order_id: vaData.mrcOrderId,
            ...vaData.extra
        };

        // Amount fields for dynamic VA
        if (vaData.collectAmountMin !== undefined) {
            requestBody.collect_amount_min = parseInt(vaData.collectAmountMin);
        }
        if (vaData.collectAmountMax !== undefined) {
            requestBody.collect_amount_max = parseInt(vaData.collectAmountMax);
        }

        // Description
        if (vaData.description) {
            requestBody.description = vaData.description;
        }

        return this.sendRequest(ENDPOINT_CREATE_VA, requestBody);
    }

    /**
     * Tạo Dynamic VA (VA động - 1 lần dùng)
     * @param {string} accName 
     * @param {string} mrcOrderId 
     * @param {number} amount 
     * @param {string} description 
     * @returns {Promise<object>}
     */
    async createDynamicVA(accName, mrcOrderId, amount, description = '') {
        return this.createVA({
            accName,
            mrcOrderId,
            accType: VA_TYPE.DYNAMIC,
            collectAmountMin: amount,
            collectAmountMax: amount,
            description,
            extra: {}
        });
    }

    /**
     * Tạo Static VA (VA tĩnh - nhiều lần dùng)
     * @param {string} accName 
     * @param {string} mrcOrderId 
     * @param {string} description 
     * @returns {Promise<object>}
     */
    async createStaticVA(accName, mrcOrderId, description = '') {
        return this.createVA({
            accName,
            mrcOrderId,
            accType: VA_TYPE.STATIC,
            description,
            extra: {}
        });
    }

    /**
     * Cập nhật VA
     * @param {string} accNo - Số VA cần update
     * @param {object} updateData 
     * @returns {Promise<object>}
     */
    async updateVA(accNo, updateData) {
        const requestBody = {
            request_id: this.generateRequestId('VA_UPD'),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
            acc_no: accNo,
            ...updateData
        };

        return this.sendRequest(ENDPOINT_UPDATE_VA, requestBody);
    }

    /**
     * Tra cứu giao dịch VA
     * @param {object} query - { accNo?, mrcOrderId?, fromDate?, toDate? }
     * @returns {Promise<object>}
     */
    async queryTransaction(query) {
        const requestBody = {
            request_id: this.generateRequestId('VA_QRY'),
            request_time: this.formatDateTime(),
            master_merchant_code: Config.get('masterMerchantCode'),
            sub_merchant_code: Config.get('subMerchantCode'),
        };

        if (query.accNo) requestBody.acc_no = query.accNo;
        if (query.mrcOrderId) requestBody.mrc_order_id = query.mrcOrderId;
        if (query.fromDate) requestBody.from_date = query.fromDate;
        if (query.toDate) requestBody.to_date = query.toDate;

        return this.sendRequest(ENDPOINT_QUERY_TRANSACTION, requestBody);
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
    generateRequestId(prefix = 'VA') {
        return `${prefix}_${this.formatDateTime().replace(/[- :]/g, '')}_${Math.random().toString(16).substr(2, 8)}`;
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
}

// Export VA types
BaokimVA.VA_TYPE = VA_TYPE;

module.exports = BaokimVA;
