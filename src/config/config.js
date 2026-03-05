/**
 * Cấu hình kết nối Baokim B2B API 
 * 
 * Hướng dẫn:
 * Điền các thông tin được Baokim cung cấp vào bên dưới
 */

module.exports = {
    // Base URL
    baseUrl: 'https://devtest.baokim.vn',
    timeout: 30000, // milliseconds

    // Merchant credentials
    merchantCode: 'YOUR_MERCHANT_CODE',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',

    // Master/Sub Merchant
    masterMerchantCode: 'YOUR_MASTER_MERCHANT_CODE',
    subMerchantCode: 'YOUR_SUB_MERCHANT_CODE',

    // RSA Keys paths (tương đối từ thư mục config/)
    merchantPrivateKeyPath: __dirname + '/../keys/merchant_private.pem',
    baokimPublicKeyPath: __dirname + '/../keys/baokim_public.pem',

    // Callback URLs
    urlSuccess: 'https://your-domain.com/payment/success',
    urlFail: 'https://your-domain.com/payment/fail',
    webhookUrl: 'https://your-domain.com/webhook/baokim',
};
