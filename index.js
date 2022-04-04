require('dotenv').config();
const ethers = require('ethers');
const configs = require('./config/config');
const contractAbi = require('./config/contract-abi');

const provider = new ethers.providers.WebSocketProvider(configs.WSSProvider);
const wallet = new ethers.Wallet(configs.userWalletPrivateKey, provider);


function splitNumberPer3digits(n){
    const newN = n.toString().match(/([\d.]{3})([\d.]{3})/);
    const numberDigit = parseFloat(`${newN[1]}.${newN[2]}`);
    return numberDigit
};

const isBull = (onePreviousEpoch, secondPreviousEpoch) => {

  const firstNumber = splitNumberPer3digits(onePreviousEpoch)
  const secondNumber = splitNumberPer3digits(secondPreviousEpoch)

  if (firstNumber > secondNumber) {
      return true
  }else{
      return false
  }
  
};

(async () => {

    const ppv2address = configs.pancakePredictV2Address;
    const firstBetAmount = configs.betAmount;

    // init contract pancake predict
    const ppv2Contract = new ethers.Contract(ppv2address, contractAbi.pancakePredictV2, wallet);

    ppv2Contract.on('StartRound', async (epoch) => {

        console.log(`Started Epoch : ${epoch.toString()}`);

        const previousRoundResult = await ppv2Contract.rounds(parseInt(epoch)-1);
        const secondPreviousRound = await ppv2Contract.rounds(parseInt(epoch)-2);

        const isBullResult = await isBull(
            parseInt(previousRoundResult.lockPrice.toString()), 
            parseInt(secondPreviousRound.lockPrice.toString())
        );

        if (isBullResult) {
            console.log('Betting on Bullish Bet.')

            try{
                const tx = await ppv2Contract.betBull(epoch, {
                    value: ethers.utils.parseUnits(firstBetAmount, 'ether')
                });

                console.log('Try to bet...')
                await tx.wait();
                console.log('Success betting on Bullish Bet.');
            }catch(e){
                console.log('Error betting on Bullish Bet, ', e.toString().split('[')[0])
            }
        }else{
            console.log('Betting on Bear Bet.')

            try{
                const tx = await ppv2Contract.betBear(epoch, {
                    value: ethers.utils.parseUnits(firstBetAmount, 'ether')
                });

                console.log('Try to bet...')
                await tx.wait();
                console.log('Success betting on Bear Bet.');
            }catch(e){
                console.log('Error betting on Bear Bet, ', e.toString().split('[')[0])
            }
        }


    });

})();
