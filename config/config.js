
const configs = {
	userWalletAddress: process.env.USER_WALLET_ADDRESS,
	userWalletPrivateKey: process.env.USER_WALLET_PRIVATE_KEY,
    betAmount: process.env.BET_AMOUNT,
    compentMultiply: process.env.COMPENT_MULTIPLY,
    rpc: process.env.RPC,
    pancakeSwapV2FactoryAddress: process.env.PANCAKE_SWAP_V2_FACTORY_ADDRESS,
	pancakeSwapV2RouterAddress: process.env.PANCAKE_SWAP_V2_ROUTER_ADDRESS,
    pancakePredictV2Address: process.env.PANCAKE_PREDICT_V2_ADDRESS,
    WSSProvider: process.env.WSS_PROVIDER
}

module.exports = configs
