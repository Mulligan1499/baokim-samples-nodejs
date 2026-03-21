/**
 * Cấu hình kết nối Baokim B2B API 
 * 
 * Hướng dẫn:
 * 1. Copy file .env.example thành .env
 * 2. Điền các thông tin được Baokim cung cấp vào file .env
 * 3. KHÔNG commit file .env lên git
 */

require('dotenv').config();

module.exports = {
    // Base URL
    baseUrl: process.env.BAOKIM_BASE_URL || 'https://devtest.baokim.vn',
    timeout: parseInt(process.env.BAOKIM_TIMEOUT) || 30000, // milliseconds

    // Merchant credentials
    merchantCode: process.env.BAOKIM_MERCHANT_CODE || '',
    clientId: process.env.BAOKIM_CLIENT_ID || '',
    clientSecret: process.env.BAOKIM_CLIENT_SECRET || '',

    // Master/Sub Merchant
    masterMerchantCode: process.env.BAOKIM_MASTER_MERCHANT_CODE || '',
    subMerchantCode: process.env.BAOKIM_SUB_MERCHANT_CODE || '',

    directMerchantCode: process.env.BAOKIM_DIRECT_MERCHANT_CODE || '',
    directClientId: process.env.BAOKIM_DIRECT_CLIENT_ID || '',
    directClientSecret: process.env.BAOKIM_DIRECT_CLIENT_SECRET || '',

    // RSA Keys paths (tương đối từ thư mục config/)
    merchantPrivateKeyPath: __dirname + '/../keys/merchant_private.pem',
    baokimPublicKeyPath: __dirname + '/../keys/baokim_public.pem',

    // Callback URLs
    urlSuccess: process.env.BAOKIM_URL_SUCCESS || 'https://your-domain.com/payment/success',
    urlFail: process.env.BAOKIM_URL_FAIL || 'https://your-domain.com/payment/fail',
    webhookUrl: process.env.BAOKIM_WEBHOOK_URL || 'https://your-domain.com/webhook/baokim',
};
