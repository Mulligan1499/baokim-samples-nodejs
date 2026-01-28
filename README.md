# Baokim B2B API - Node.js 18 Example

Bộ source code mẫu để tích hợp với hệ thống B2B của Baokim, viết bằng Node.js 18.

## 🔧 Yêu cầu

- **Node.js**: 18.0.0 trở lên (sử dụng native fetch)
- Không cần cài đặt thêm dependencies

## 📦 Cài đặt

```bash
git clone https://github.com/Mulligan1499/baokim-b2b-nodejs18-example.git
cd nodejs18-b2b-example

# Tạo config
cp config/config.js config/config.local.js

# Tạo private key
# Copy private key vào keys/merchant_private.pem
```

## 🚀 Quick Start

### Chạy test toàn bộ APIs

```bash
node test_full_flow.js
```

### Test với refund

```bash
node test_full_flow.js ORDER_ID AMOUNT
```

### Test với hủy thu hộ tự động

```bash
node test_full_flow.js ORDER_ID AMOUNT AUTO_DEBIT_TOKEN
```

## 📁 Cấu trúc thư mục

```
nodejs18-b2b-example/
├── config/
│   ├── config.js              # Config mẫu
│   └── config.local.js        # Config thực (không commit)
├── src/
│   ├── index.js               # Export modules
│   ├── Config.js              # Quản lý config
│   ├── Logger.js              # Ghi log
│   ├── SignatureHelper.js     # Ký số RSA SHA256
│   ├── HttpClient.js          # HTTP Client (native fetch)
│   ├── BaokimAuth.js          # OAuth2 authentication
│   ├── BaokimOrder.js         # Basic Pro APIs
│   ├── BaokimVA.js            # VA Host to Host APIs
│   └── ErrorCode.js           # Mapping mã lỗi
├── examples/
│   ├── basic_pro/
│   └── va_host_to_host/
├── keys/                       # RSA Keys
├── logs/                       # Log files
├── test_full_flow.js          # Test tất cả APIs
└── package.json
```

## 📚 API Reference

### Basic Pro APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/b2b/auth-service/api/oauth/get-token` | POST | Lấy access token |
| `/b2b/core/api/ext/mm/order/send` | POST | Tạo đơn hàng |
| `/b2b/core/api/ext/mm/order/get-order` | POST | Tra cứu đơn hàng |
| `/b2b/core/api/ext/mm/refund/send` | POST | Hoàn tiền |
| `/b2b/core/api/ext/mm/autodebit/cancel` | POST | Hủy thu hộ tự động |

### VA Host to Host APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/b2b/core/api/ext/mm/bank-transfer/create` | POST | Tạo VA |
| `/b2b/core/api/ext/mm/bank-transfer/update` | POST | Cập nhật VA |
| `/b2b/core/api/ext/mm/bank-transfer/detail` | POST | Tra cứu giao dịch |

## 🖥️ Chạy trên Replit

1. Import repo từ GitHub
2. Tạo `config/config.local.js`
3. Tạo `keys/merchant_private.pem`
4. Click **Run**

---

© 2026 Baokim. All rights reserved.
