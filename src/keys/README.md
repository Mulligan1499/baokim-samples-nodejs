# Keys Directory

Đặt các file RSA key vào thư mục này:

- `merchant_private.pem` - Private key của Merchant (dùng để ký request)
- `baokim_public.pem` - Public key của Baokim (dùng để verify webhook)

## Tạo RSA Key Pair

```bash
# Tạo private key
openssl genrsa -out merchant_private.pem 2048

# Tạo public key
openssl rsa -in merchant_private.pem -pubout -out merchant_public.pem
```

Gửi `merchant_public.pem` cho Baokim để đăng ký.
