/**
 * Example: Tra cứu đơn hàng Direct
 */

const { Config, BaokimAuth, BaokimDirect } = require('../../src');

async function main() {
    const mrcOrderId = process.argv[2];

    if (!mrcOrderId) {
        console.log('Usage: node 02_query_order.js <mrc_order_id>');
        return;
    }

    try {
        Config.load();

        const auth = BaokimAuth.forDirectConnection();
        const directService = new BaokimDirect(await auth.getToken());

        const result = await directService.queryOrder(mrcOrderId);

        if (result.success) {
            console.log('✅ Tra cứu thành công!');
            console.log('\n📋 Full response data:');
            console.log(JSON.stringify(result.data, null, 2));
        } else {
            console.log(`❌ Lỗi: ${result.message}`);
            console.log('\n📋 Full response:');
            console.log(JSON.stringify(result.rawResponse, null, 2));
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
