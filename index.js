require('dotenv').config();
const ethers = require('ethers');
const configs = require('./config/config');
const contractAbi = require('./config/contract-abi');
const chalk = require('chalk');
const moment = require('moment');
const chalkAnimation = require('chalk-animation');
const inquirer = require('inquirer');
const { Wallet } = require('ethers');
const delay = require('delay');





function splitNumberPer3digits(n) {
    const newN = n.toString().match(/([\d.]{3})([\d.]{3})/);
    const numberDigit = parseFloat(`${newN[1]}.${newN[2]}`);
    return numberDigit
};

const isBull = (onePreviousEpoch, secondPreviousEpoch) => {

    const firstNumber = splitNumberPer3digits(onePreviousEpoch)
    const secondNumber = splitNumberPer3digits(secondPreviousEpoch)


    if (firstNumber > secondNumber) {
        return true
    } else {
        return false
    }

};

(async () => {

    const provider = new ethers.providers.JsonRpcProvider(configs.rpc);
    let wallet = {};



    const questions = [
        {
            type: 'password',
            name: 'password',
            mask: '*',
            message: "Insert your Mnemonic / Private Key here : ",
            validate: function (value) {
                if (value.includes('0x') || !/\s/g.test(value)) {
                    console.log('masuk sini')
                    try {
                        wallet = new ethers.Wallet(value, provider);
                        return true;
                    } catch (e) {
                        return 'Please enter a valid Mnemonic / private key';
                    }
                } else {
                    try {
                        wallet = Wallet.fromMnemonic(value);
                        wallet = new ethers.Wallet(wallet.privateKey, provider);
                        return true;
                    } catch (e) {
                        return 'Please enter a valid Mnemonic / private key';
                    }
                }


            },
        },
    ];

    inquirer.prompt(questions).then((answers) => {

        console.log('')
        chalkAnimation.glitch('Started Pancake Prediction BOT')


        const ppv2address = configs.pancakePredictV2Address;
        const firstBetAmount = configs.betAmount;

        // init contract pancake predict
        const ppv2Contract = new ethers.Contract(ppv2address, contractAbi.pancakePredictV2, wallet);

        console.log(`
        ############################# CONFIG #############################
                                                                       
        Your wallet address :   ${chalk.green(wallet.address)}      
        Bet Amount :   ${chalk.green(firstBetAmount)} BNB
                                                                 
                                                                        
        ##################################################################
        `)

        ppv2Contract.on('StartRound', async (epoch) => {

            console.log('')
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Start Epoch : ${epoch.toString()}`));


            const previousRoundResult = await ppv2Contract.rounds(parseInt(epoch) - 1);
            const secondPreviousRound = await ppv2Contract.rounds(parseInt(epoch) - 2);

            const isBullResult = await isBull(
                parseInt(previousRoundResult.lockPrice.toString()),
                parseInt(secondPreviousRound.lockPrice.toString())
            );

            if (isBullResult) {
                console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Betting on Bullish Bet.`))

                let error = true;
                let errorDetail = '';
                do {
                    if (error && !errorDetail.includes('Error: insufficient funds for intrinsic transaction co')) {
                        try {
                            await delay(1000);
                            const tx = await ppv2Contract.betBull(epoch, {
                                value: ethers.utils.parseUnits(firstBetAmount, 'ether')
                            });

                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Try to bet...`))
                            await tx.wait();
                            error = false;
                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Success betting on Bullish Bet.`))
                        } catch (e) {
                            errorDetail = e.toString().split('[')[0];
                            error = true;
                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.red(e.toString().split('[')[0]))

                        }
                    } else {
                        error = false;
                    }
                } while (error);

                error = true;


            } else {
                console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Betting on Bear Bet.`))

                let error = true;
                let errorDetail = '';
                do {
                    if (error && !errorDetail.includes('Error: insufficient funds for intrinsic transaction co')) {
                        try {
                            await delay(1000);
                            const tx = await ppv2Contract.betBear(epoch, {
                                value: ethers.utils.parseUnits(firstBetAmount, 'ether')
                            });

                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Try to bet...`))
                            await tx.wait();
                            error = false;
                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Success betting on Bear Bet.`))
                        } catch (e) {
                            error = true;
                            errorDetail = e.toString().split('[')[0];
                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.red(e.toString().split('[')[0]))
                        }
                    } else {
                        error = false;
                    }

                } while (error);

                error = true;


            }


        });
    });





})();
