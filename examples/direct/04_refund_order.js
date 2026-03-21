/**
 * Example: Hoàn tiền đơn hàng Direct
 */

const { Config, BaokimAuth, BaokimDirect } = require('../../src');

async function main() {
    const mrcOrderId = process.argv[2];
    const description = process.argv[3] || 'Hoàn tiền đơn hàng';
    const amount = process.argv[4] ? parseInt(process.argv[4]) : null;

    if (!mrcOrderId) {
        console.log('Usage: node 04_refund_order.js <mrc_order_id> [description] [amount]');
        console.log('Example: node 04_refund_order.js DRT_123456 "Hoàn tiền" 50000');
        console.log('  - description: Lý do hoàn tiền (default: "Hoàn tiền đơn hàng")');
        console.log('  - amount: Số tiền hoàn (bỏ trống = hoàn toàn bộ)');
        return;
    }

    try {
        Config.load();

        const auth = BaokimAuth.forDirectConnection();
        const directService = new BaokimDirect(await auth.getToken());

        console.log(`\n🔄 Hoàn tiền đơn hàng: ${mrcOrderId}`);
        console.log(`   Lý do: ${description}`);
        console.log(`   Số tiền: ${amount ? amount.toLocaleString() + ' VND' : 'Toàn bộ'}`);

        const result = await directService.refundOrder(mrcOrderId, description, amount);

        if (result.success) {
            console.log('\n✅ Hoàn tiền thành công!');
        } else {
            console.log('\n❌ Hoàn tiền thất bại!');
        }
        console.log('   Code:', result.code);
        console.log('   Message:', result.message);
        if (result.data) {
            console.log('   Data:', JSON.stringify(result.data, null, 2));
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
