/**
 * SignatureHelper - Ký số RSA SHA256
 */

const crypto = require('crypto');
const fs = require('fs');
const Config = require('./Config');

/**
 * Ký dữ liệu bằng private key
 * @param {string} data - Dữ liệu cần ký (JSON string)
 * @param {string} keyPath - Đường dẫn private key (optional)
 * @returns {string} - Signature base64
 */
function sign(data, keyPath = null) {
    const privateKeyPath = keyPath || Config.get('merchantPrivateKeyPath');

    if (!fs.existsSync(privateKeyPath)) {
        throw new Error(`Private key not found: ${privateKeyPath}`);
    }

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data);
    signer.end();

    return signer.sign(privateKey, 'base64');
}

/**
 * Xác thực chữ ký
 * @param {string} data - Dữ liệu gốc
 * @param {string} signature - Chữ ký base64
 * @param {string} keyPath - Đường dẫn public key (optional)
 * @returns {boolean}
 */
function verify(data, signature, keyPath = null) {
    const publicKeyPath = keyPath || Config.get('baokimPublicKeyPath');

    if (!fs.existsSync(publicKeyPath)) {
        throw new Error(`Public key not found: ${publicKeyPath}`);
    }

    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    verifier.end();

    return verifier.verify(publicKey, signature, 'base64');
}

/**
 * Tạo cặp RSA key mới
 * @param {number} modulusLength - Độ dài key (mặc định 2048)
 * @returns {object} - { publicKey, privateKey }
 */
function generateKeyPair(modulusLength = 2048) {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
}

module.exports = {
    sign,
    verify,
    generateKeyPair
};
