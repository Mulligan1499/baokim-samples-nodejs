/**
 * Test Full API Flow - Baokim B2B Node.js 18
 * 
 * Chạy test tất cả các API:
 * 1. Lấy Token
 * 2. Tạo đơn hàng
 * 3. Tra cứu đơn hàng
 * 4. Tạo Dynamic VA
 * 5. Tra cứu giao dịch VA
 * 6. Tạo đơn Thu hộ tự động
 * 7. Hủy thu hộ tự động
 * 8. Hoàn tiền
 */

const { Config, BaokimAuth, BaokimOrder, BaokimVA, ErrorCode } = require('./src');

// Parse command line arguments
const refundOrderId = process.argv[2] || null;
const refundAmount = process.argv[3] ? parseInt(process.argv[3]) : null;
const autoDebitToken = process.argv[4] || null;

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║       BAOKIM B2B API - FULL TEST FLOW (Node.js 18)       ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const results = {};

    try {
        Config.load();

        console.log(`📌 Environment: ${Config.get('baseUrl')}`);
        console.log(`📌 Merchant: ${Config.get('merchantCode')}\n`);

        // ============================================================
        // 1. TEST LẤY TOKEN
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [1/8] LẤY ACCESS TOKEN');
        console.log('━'.repeat(60));

        const auth = new BaokimAuth();
        const token = await auth.getToken();
        results.token = true;

        console.log(`✅ Token: ${token.substr(0, 50)}...\n`);

        // ============================================================
        // 2. TEST TẠO ĐƠN HÀNG
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [2/8] TẠO ĐƠN HÀNG THƯỜNG');
        console.log('━'.repeat(60));

        const orderService = new BaokimOrder(auth);
        const mrcOrderId = `TEST_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
        const amount = 100000;

        const orderResult = await orderService.createOrder({
            mrcOrderId,
            totalAmount: amount,
            description: `Test order ${mrcOrderId}`,
            customerInfo: BaokimOrder.buildCustomerInfo(
                'Nguyen Van A',
                'test@example.com',
                '0901234567',
                '123 Test Street'
            ),
        });

        results.createOrder = orderResult.success;

        if (orderResult.success) {
            console.log('✅ Tạo đơn thành công!');
            console.log(`   Order ID: ${orderResult.data.order_id}`);
            console.log(`   MRC Order ID: ${mrcOrderId}`);
            console.log(`   Amount: ${amount.toLocaleString()} VND`);
            console.log(`   Payment URL: ${orderResult.data.redirect_url}\n`);
        } else {
            console.log(`❌ Lỗi: ${orderResult.message}\n`);
        }

        // ============================================================
        // 3. TEST TRA CỨU ĐƠN HÀNG
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [3/8] TRA CỨU ĐƠN HÀNG');
        console.log('━'.repeat(60));

        const queryResult = await orderService.queryOrder(mrcOrderId);
        results.queryOrder = queryResult.success;

        if (queryResult.success) {
            const order = queryResult.data.order;
            console.log('✅ Tra cứu thành công!');
            console.log(`   Order ID: ${order.id}`);
            console.log(`   Status: ${order.status} (${order.status == 1 ? 'Đã thanh toán' : 'Chưa thanh toán'})`);
            console.log(`   Amount: ${parseInt(order.total_amount).toLocaleString()} VND\n`);
        } else {
            console.log(`❌ Lỗi: ${queryResult.message}\n`);
        }

        // ============================================================
        // 4. TEST TẠO DYNAMIC VA
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [4/8] TẠO DYNAMIC VA (Host to Host)');
        console.log('━'.repeat(60));

        const vaService = new BaokimVA(auth);
        const vaOrderId = `VA_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
        const vaAmount = 100000;

        const vaResult = await vaService.createDynamicVA(
            'NGUYEN VAN A',
            vaOrderId,
            vaAmount,
            `Test VA ${vaOrderId}`
        );

        let vaNumber = null;
        results.createVA = vaResult.success;

        if (vaResult.success) {
            vaNumber = vaResult.data.acc_no;
            console.log('✅ Tạo VA thành công!');
            console.log(`   VA Number: ${vaNumber}`);
            console.log(`   Bank: ${vaResult.data.bank_name}`);
            console.log(`   Account Name: ${vaResult.data.acc_name}`);
            console.log(`   Amount: ${vaAmount.toLocaleString()} VND`);
            console.log(`   QR: ${vaResult.data.qr_path}\n`);
        } else {
            console.log(`❌ Lỗi: ${vaResult.message}\n`);
        }

        // ============================================================
        // 5. TEST TRA CỨU GIAO DỊCH VA
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [5/8] TRA CỨU GIAO DỊCH VA (bank-transfer/detail)');
        console.log('━'.repeat(60));

        if (vaNumber) {
            const vaQueryResult = await vaService.queryTransaction({ accNo: vaNumber });
            results.queryVA = vaQueryResult.success;

            if (vaQueryResult.success) {
                console.log('✅ Tra cứu VA thành công!');
                console.log(`   Endpoint: /bank-transfer/detail`);
                console.log(`   VA: ${vaQueryResult.data.va_info.acc_no}`);
                console.log(`   Bank: ${vaQueryResult.data.va_info.bank_name}`);
                console.log(`   Transactions: ${vaQueryResult.data.transactions.length}\n`);
            } else {
                console.log(`❌ Lỗi: ${vaQueryResult.message}\n`);
            }
        } else {
            results.queryVA = false;
            console.log('⚠️ Bỏ qua vì không có VA number\n');
        }

        // ============================================================
        // 6. TEST TẠO ĐƠN THU HỘ TỰ ĐỘNG
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [6/8] TẠO ĐƠN THU HỘ TỰ ĐỘNG (payment_method=22)');
        console.log('━'.repeat(60));

        const autoDebitOrderId = `TT${Date.now()}`;

        const autoDebitResult = await orderService.createOrder({
            mrcOrderId: autoDebitOrderId,
            totalAmount: 0,
            description: `Don hang Test ${autoDebitOrderId}`,
            paymentMethod: BaokimOrder.PAYMENT_METHOD.AUTO_DEBIT,
            serviceCode: 'QL_THU_HO_1',
            saveToken: 0,
            items: [{
                code: 'PROD001',
                name: 'San pham A',
                amount: 0,
                quantity: 1,
                link: 'https://example.com/product-a',
            }],
            customerInfo: {
                code: 'KH01',
                name: 'AUTOMATION TEST',
                email: 'test@example.com',
                phone: '0911830977',
                address: '123 Nguyen Trai, Hanoi',
                gender: 1,
            },
        });

        results.autoDebit = autoDebitResult.success;

        if (autoDebitResult.success) {
            console.log('✅ Tạo đơn Thu hộ tự động thành công!');
            console.log(`   Order ID: ${autoDebitResult.data.order_id}`);
            console.log(`   MRC Order ID: ${autoDebitOrderId}`);
            console.log(`   Payment Method: 22 (Thu hộ tự động)`);
            console.log(`   Redirect URL: ${autoDebitResult.data.redirect_url}\n`);
        } else {
            console.log(`❌ Lỗi: ${autoDebitResult.message}`);
            console.log(`   Code: ${autoDebitResult.code}\n`);
        }

        // ============================================================
        // 7. TEST HỦY THU HỘ TỰ ĐỘNG
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [7/8] HỦY THU HỘ TỰ ĐỘNG');
        console.log('━'.repeat(60));

        if (autoDebitToken) {
            console.log(`   Token: ${autoDebitToken.substr(0, 20)}...`);

            const cancelResult = await orderService.cancelAutoDebit(autoDebitToken);
            results.cancelAutoDebit = cancelResult.success;

            if (cancelResult.success) {
                console.log('✅ Hủy thu hộ tự động thành công!');
                console.log(`   Code: ${cancelResult.code}`);
                console.log(`   Message: ${cancelResult.message}\n`);
            } else {
                console.log(`❌ Lỗi: ${cancelResult.message}\n`);
            }
        } else {
            results.cancelAutoDebit = 'skipped';
            console.log('⚠️ Để test hủy thu hộ tự động, chạy:');
            console.log('   node test_full_flow.js ORDER_ID AMOUNT AUTO_DEBIT_TOKEN\n');
        }

        // ============================================================
        // 8. TEST HOÀN TIỀN
        // ============================================================
        console.log('━'.repeat(60));
        console.log('📍 [8/8] HOÀN TIỀN');
        console.log('━'.repeat(60));

        if (refundOrderId && refundAmount) {
            console.log(`   Order ID: ${refundOrderId}`);
            console.log(`   Amount: ${refundAmount.toLocaleString()} VND`);

            const refundResult = await orderService.refundOrder(refundOrderId, refundAmount, 'Test refund');
            results.refund = refundResult.success;

            if (refundResult.success) {
                console.log('✅ Hoàn tiền thành công!');
                console.log(`   Code: ${refundResult.code}`);
                console.log(`   Message: ${refundResult.message}\n`);
            } else {
                console.log(`❌ Lỗi: ${refundResult.message}\n`);
            }
        } else {
            results.refund = 'skipped';
            console.log('⚠️ Để test refund, chạy:');
            console.log('   node test_full_flow.js ORDER_ID AMOUNT\n');
        }

        // ============================================================
        // SUMMARY
        // ============================================================
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║                    TEST COMPLETED                        ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        console.log('📋 Summary:');
        console.log(`   [1] Token: ✅`);
        console.log(`   [2] Create Order: ${results.createOrder ? '✅' : '❌'} (${mrcOrderId})`);
        console.log(`   [3] Query Order: ${results.queryOrder ? '✅' : '❌'}`);
        console.log(`   [4] Create VA (H2H): ${results.createVA ? '✅' : '❌'}${vaNumber ? ` (${vaNumber})` : ''}`);
        console.log(`   [5] Query VA (H2H): ${results.queryVA ? '✅' : '❌'}`);
        console.log(`   [6] Auto Debit Order: ${results.autoDebit ? '✅' : '❌'} (${autoDebitOrderId})`);
        console.log(`   [7] Cancel Auto Debit: ${results.cancelAutoDebit === 'skipped' ? '⏭️ Skipped' : (results.cancelAutoDebit ? '✅' : '❌')}`);
        console.log(`   [8] Refund: ${results.refund === 'skipped' ? '⏭️ Skipped' : (results.refund ? '✅' : '❌')}\n`);

        const date = new Date().toISOString().split('T')[0];
        console.log(`📁 Log file: logs/api_${date}.log`);

    } catch (error) {
        console.error(`\n❌ EXCEPTION: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
    }
}

// Run tests
runTests();
