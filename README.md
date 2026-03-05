# Baokim B2B API - Node.js 18 SDK

Bộ SDK tích hợp Baokim B2B API, viết bằng Node.js 18+ (sử dụng native fetch, không dependencies).

## 🔧 Yêu cầu
- Node.js 18+

---

## 📦 Tích hợp vào project của bạn

### Bước 1: Clone SDK

```bash
git clone https://github.com/ITBaoKim/baokim-samples-nodejs.git
```

### Bước 2: Copy thư mục `src/` vào project

```bash
cp -r baokim-samples-nodejs/src /path/to/your-project/baokim-sdk
```

Thư mục `src/` đã bao gồm sẵn config và keys, bạn chỉ cần copy 1 folder duy nhất:

```
your-project/
├── baokim-sdk/            # Chỉ cần copy folder src/ này
│   ├── index.js
│   ├── BaokimAuth.js
│   ├── Config.js
│   ├── HttpClient.js
│   ├── config/            # ← Config nằm sẵn trong SDK
│   │   └── config.js      # File cấu hình (điền thông tin ở bước 3)
│   ├── keys/              # ← Keys nằm sẵn trong SDK
│   │   ├── merchant_private.pem
│   │   └── baokim_public.pem
│   ├── MasterSub/
│   │   └── BaokimOrder.js
│   ├── HostToHost/
│   │   └── BaokimVA.js
│   └── Direct/
│       └── BaokimDirect.js
├── logs/                  # Thư mục log (tự tạo)
└── your-code.js
```

### Bước 3: Cấu hình

Mở file `baokim-sdk/config/config.js` và điền thông tin Baokim cung cấp:
```javascript
module.exports = {
    baseUrl: 'https://devtest.baokim.vn',  // hoặc https://openapi.baokim.vn
    timeout: 30000,
    
    merchantCode: 'YOUR_MERCHANT_CODE',
    clientId: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    
    masterMerchantCode: 'YOUR_MASTER_MERCHANT_CODE',
    subMerchantCode: 'YOUR_SUB_MERCHANT_CODE',
    
    // RSA Keys (đường dẫn tương đối từ thư mục config/)
    merchantPrivateKeyPath: __dirname + '/../keys/merchant_private.pem',
    baokimPublicKeyPath: __dirname + '/../keys/baokim_public.pem',
    
    // Webhook URLs
    urlSuccess: 'https://your-domain.com/payment/success',
    urlFail: 'https://your-domain.com/payment/fail',
    webhookUrl: 'https://your-domain.com/webhook/baokim',
};
```

### Bước 4: Đặt RSA Keys

Đặt file Private Key (Baokim cung cấp) vào `baokim-sdk/keys/`:
```bash
# Copy merchant_private.pem vào baokim-sdk/keys/
```

### Bước 5: Tạo thư mục logs

```bash
mkdir -p logs
```

---

## 🚀 Sử dụng SDK

### Khởi tạo (bắt buộc ở đầu mỗi file)

```javascript
const { Config, BaokimAuth } = require('./baokim-sdk');

// Load config (tự động load từ baokim-sdk/config/config.js)
Config.load();

// Khởi tạo Auth
const auth = new BaokimAuth();
```

---

## 🔷 API 1: Lấy Access Token

```javascript
const { Config, BaokimAuth } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const token = await auth.getToken();

console.log('Token:', token.substring(0, 50) + '...');
```

```bash
node 01_get_token.js
```

---

## 🔷 API 2: Tạo đơn hàng (Basic Pro - Master/Sub)

```javascript
const { Config, BaokimAuth, BaokimOrder } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const orderService = new BaokimOrder(auth);

const mrcOrderId = 'ORDER_' + Date.now();

const result = await orderService.createOrder({
    mrcOrderId: mrcOrderId,
    totalAmount: 100000,
    description: 'Thanh toan don hang ' + mrcOrderId,
    customerInfo: BaokimOrder.buildCustomerInfo(
        'Nguyen Van A', 'test@email.com', '0901234567', '123 Street'
    ),
});

console.log('Success:', result.success);
if (result.success && result.data.redirect_url) {
    console.log('Payment URL:', result.data.redirect_url);
}
console.log(result);
```

```bash
node 02_create_order.js
```

---

## 🔷 API 3: Tra cứu đơn hàng

```javascript
const { Config, BaokimAuth, BaokimOrder } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const orderService = new BaokimOrder(auth);

const mrcOrderId = process.argv[2] || 'ORDER_TEST';
const result = await orderService.queryOrder(mrcOrderId);

console.log('Success:', result.success);
console.log(result);
```

```bash
node 03_query_order.js ORDER_20260224120000_1234
```

---

## 🔷 API 4: Hoàn tiền (Refund)

```javascript
const { Config, BaokimAuth, BaokimOrder } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const orderService = new BaokimOrder(auth);

const mrcOrderId = process.argv[2] || 'ORDER_TEST';
const refundAmount = parseInt(process.argv[3]) || 0;

const result = await orderService.refundOrder(mrcOrderId, refundAmount, 'Hoan tien cho khach');

console.log('Success:', result.success);
console.log(result);
```

```bash
node 04_refund_order.js ORDER_ID 50000
```

---

## 🔷 API 5: Tạo Virtual Account - VA (Host-to-Host)

```javascript
const { Config, BaokimAuth, BaokimVA } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const vaService = new BaokimVA(auth);

const orderId = 'VA_' + Date.now();

const result = await vaService.createDynamicVA(
    'NGUYEN VAN A',    // Tên khách hàng
    orderId,           // Mã đơn hàng
    100000             // Số tiền
);

console.log('Success:', result.success);
if (result.success && result.data.acc_no) {
    console.log('Số VA:', result.data.acc_no);
}
console.log(result);
```

```bash
node 05_create_va.js
```

---

## 🔷 API 6: Tra cứu giao dịch VA

```javascript
const { Config, BaokimAuth, BaokimVA } = require('./baokim-sdk');

Config.load();

const auth = new BaokimAuth();
const vaService = new BaokimVA(auth);

const result = await vaService.queryTransaction({
    accNo: '00812345678901',   // Thay bằng số VA thật từ API 5
});

console.log('Success:', result.success);
console.log(result);
```

```bash
node 06_query_va.js
```

---

## 🔷 API 7: Tạo đơn hàng Direct Connection

> ⚠️ Direct connection sử dụng credentials riêng (`directClientId`, `directClientSecret`). Thêm vào config nếu có.

```javascript
const { Config, BaokimAuth, BaokimDirect } = require('./baokim-sdk');

Config.load();

// Direct connection dùng credentials riêng
const directAuth = BaokimAuth.forDirectConnection();
const directService = new BaokimDirect(directAuth);

const mrcOrderId = 'DRT_' + Date.now();

const result = await directService.createOrder({
    mrcOrderId: mrcOrderId,
    totalAmount: 150000,
    description: 'Thanh toan Direct ' + mrcOrderId,
    customerInfo: {
        name: 'NGUYEN VAN A',
        email: 'customer@email.com',
        phone: '0901234567',
        address: '123 Nguyen Hue, HCM',
        gender: 1,
    },
});

console.log('Success:', result.success);
if (result.success && result.data.redirect_url) {
    console.log('Payment URL:', result.data.redirect_url);
}
console.log(result);
```

```bash
node 07_direct_order.js
```

---

## 🔷 API 8: Xử lý Webhook từ Baokim (Verify Signature)

Khi có giao dịch thành công (thanh toán, hoàn tiền, VA...), **Baokim sẽ gửi HTTP POST** đến webhook URL của merchant.

### Cấu hình

Đặt file **Baokim Public Key** (do Baokim cung cấp) vào `baokim-sdk/keys/baokim_public.pem`.

### Code example

```javascript
// webhook_server.js
const http = require('http');
const { Config, SignatureHelper } = require('./baokim-sdk');

Config.load();

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                // Lấy signature từ header
                const signature = req.headers['signature'];
                if (!signature) {
                    throw new Error('Signature header not found');
                }

                // Verify signature bằng Baokim Public Key
                const isValid = SignatureHelper.verify(body, signature);
                if (!isValid) {
                    throw new Error('Invalid signature');
                }

                // Parse webhook data
                const webhookData = JSON.parse(body);
                console.log('✅ Webhook verified! Data:', JSON.stringify(webhookData, null, 2));

                // TODO: Cập nhật trạng thái đơn hàng trong database

                // Trả về success
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 0, message: 'Success' }));
            } catch (e) {
                console.error('❌ Webhook error:', e.message);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: 1, message: e.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(8080, () => console.log('Webhook server: http://localhost:8080/webhook'));
```

### Chạy server

```bash
node webhook_server.js
```

### Response format

Merchant cần trả về JSON với `code = 0` khi xử lý thành công:
```json
{"code": 0, "message": "Success"}
```

---

## 📚 API Endpoints

### Basic Pro (Master/Sub)
| API | Endpoint |
|-----|----------|
| Tạo đơn | `/b2b/core/api/ext/mm/order/send` |
| Tra cứu | `/b2b/core/api/ext/mm/order/get-order` |
| Hoàn tiền | `/b2b/core/api/ext/mm/refund/send` |

### VA Host to Host
| API | Endpoint |
|-----|----------|
| Tạo VA | `/b2b/core/api/ext/mm/bank-transfer/create` |
| Cập nhật VA | `/b2b/core/api/ext/mm/bank-transfer/update` |
| Tra cứu VA | `/b2b/core/api/ext/mm/bank-transfer/detail` |

### Direct Connection
| API | Endpoint |
|-----|----------|
| Tạo đơn | `/b2b/core/api/ext/order/send` |
| Tra cứu | `/b2b/core/api/ext/order/get-order` |
| Hủy đơn | `/b2b/core/api/ext/order/cancel` |

---

## ❓ Troubleshooting

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `Chữ ký số không hợp lệ` | Private key không đúng | Kiểm tra file `keys/merchant_private.pem` |
| `Token expired` | Token hết hạn | SDK tự động refresh, không cần xử lý |
| `Invalid merchant_code` | Sai mã merchant | Kiểm tra config |
| `Config file not found` | Chưa cấu hình config.js | Mở file `config.js` và điền thông tin |

---
© 2026 Baokim
