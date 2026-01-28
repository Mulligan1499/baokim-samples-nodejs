/**
 * ErrorCode - Mapping mã lỗi Baokim
 */

const ERROR_CODES = {
    0: 'Thành công',
    100: 'Đang xử lý',
    101: 'Thành công - Cần redirect',
    102: 'Lỗi từ nhà cung cấp dịch vụ',
    103: 'Chữ ký số không hợp lệ',
    104: 'Signature không hợp lệ',
    111: 'Xác thực thất bại',
    115: 'Giao dịch chưa có thông tin STK ngân hàng',
    200: 'Thành công',
    422: 'Dữ liệu đầu vào không hợp lệ',
    707: 'Mã đơn hàng đã tồn tại',
};

/**
 * Lấy message từ error code
 * @param {number} code 
 * @returns {string}
 */
function getMessage(code) {
    return ERROR_CODES[code] || `Mã lỗi không xác định: ${code}`;
}

/**
 * Kiểm tra code có phải thành công không
 * @param {number} code 
 * @returns {boolean}
 */
function isSuccess(code) {
    return [0, 100, 101, 200].includes(code);
}

module.exports = {
    getMessage,
    isSuccess,
    ERROR_CODES
};
