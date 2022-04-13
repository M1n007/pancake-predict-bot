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
const NodeCache = require("node-cache");
const myCache = new NodeCache();


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

const betting = async (method, ppv2Contract, epoch, betAmount) => {
    if (method.toLowerCase() == 'up') {
        console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Betting on Bullish Bet.`))

        let error = true;
        let errorDetail = '';
        do {
            if (!errorDetail || errorDetail.includes('cannot estimate gas')) {
                try {
                    await delay(1000);
                    const tx = await ppv2Contract.betBull(epoch, {
                        value: ethers.utils.parseUnits(betAmount, 'ether')
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
            if (!errorDetail || errorDetail.includes('cannot estimate gas')) {
                try {
                    await delay(1000);
                    const tx = await ppv2Contract.betBear(epoch, {
                        value: ethers.utils.parseUnits(betAmount, 'ether')
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
}

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
        {
            type: 'input',
            name: 'method',
            message: "Input your method ex. (UP UP DOWN DOWN) : ",
            default() {
                return 'UP UP DOWN DOWN';
            },
        }
    ];

    inquirer.prompt(questions).then(async (answers) => {


        console.log('')
        chalkAnimation.glitch('Started Pancake Prediction BOT')


        const ppv2address = configs.pancakePredictV2Address;
        const firstBetAmount = configs.betAmount;

        // init contract pancake predict
        const ppv2Contract = new ethers.Contract(ppv2address, contractAbi.pancakePredictV2, wallet);

        // Compent Multiply : x${chalk.red(configs.compentMultiply)}

        console.log(`
        ############################# CONFIG #############################
                                                                       
        Your wallet address :   ${chalk.green(wallet.address)}      
        Bet Amount :   ${chalk.green(firstBetAmount)} BNB
        Method : ${chalk.yellow(answers['method'])}
                                                                 
                                                                        
        ##################################################################
        `)

        const currentEpoch = await ppv2Contract.currentEpoch();


        const methodToArray = answers['method'].split(' ');

        //first bet
        if (methodToArray[0].toLowerCase() == 'up') {
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Start Epoch : ${currentEpoch.toString()}`));
            await betting('up', ppv2Contract, currentEpoch, firstBetAmount);
            methodToArray.splice(0, 1);
            myCache.set('round', {
                round: 1,
                dataMethod: methodToArray,
                epoch: currentEpoch
            })
        } else {
            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Start Epoch : ${currentEpoch.toString()}`));
            await betting('down', ppv2Contract, currentEpoch, firstBetAmount);
            methodToArray.splice(0, 1);
            myCache.set('round', {
                round: 1,
                dataMethod: methodToArray,
                epoch: currentEpoch
            })
        }



        ppv2Contract.on('StartRound', async (epoch) => {

            const haveRound = myCache.get('round');

            if (epoch.toString() !== haveRound.epoch.toString()) {

                const haveCompent = myCache.get('compent');
                if (!haveCompent) {
                    // const haveRound = myCache.get('round');
                    // if (haveRound) {
                    //     console.log('')
                    //     console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.magenta('Are you winning on previous round ? wait a moment for closing.'));
                    //     const claimableEpochs = await ppv2Contract.claimable(parseInt(haveRound.epoch.toString()), wallet.address);
                    //     console.log(claimableEpochs, haveRound.epoch.toString())
                    //     if (claimableEpochs) {
                    //         console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green('Off Course Yes!!! I will claim for you, wait.'));
                    //         try {
                    //             const tx = await ppv2Contract.claim(haveRound.epoch);

                    //             const receipt = await tx.wait();
                    //             console.log(receipt)

                    //             console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Epoch ${parseInt(haveRound.epoch.toString())} claimed....Yess`));
                    //         } catch (e) {
                    //             console.log(e)
                    //             console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.yellow(`Failed to claim, try manually :'(`));
                    //         }
                    //     } else {
                    //         myCache.set('compent', {
                    //             position: 1,
                    //             amount: firstBetAmount * parseInt(configs.compentMultiply)
                    //         })
                    //         console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.red('Off Course NOT!!! Hahahaaha'));
                    //     }
                    // }




                    console.log('')
                    console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Start Epoch : ${epoch.toString()}`));

                    let checkRound = myCache.get('round');
                    if (checkRound.dataMethod.length >= 1) {
                        await betting(checkRound.dataMethod[0], ppv2Contract, epoch, firstBetAmount);
                        checkRound.dataMethod.splice(0, 1);
                        myCache.set('round', {
                            round: checkRound.round + 1,
                            dataMethod: checkRound.dataMethod,
                            epoch: parseInt(epoch.toString())
                        });
                    } else {
                        await betting(methodToArray[0], ppv2Contract, epoch, firstBetAmount);
                        methodToArray.splice(0, 1);
                        myCache.set('round', {
                            round: 1,
                            dataMethod: methodToArray,
                            epoch: parseInt(epoch.toString())
                        });
                    }
                } else {
                    const haveRound = myCache.get('round');

                    if (haveRound) {
                        if (parseInt(haveRound.epoch.toString()) == parseInt(epoch.toString()) - 1) {
                            console.log('')
                            console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.magenta('Are you winning on previous round ? wait a moment for closing.'));
                            const claimableEpochs = await ppv2Contract.claimable(parseInt(haveRound.epoch.toString()), wallet.address);
                            if (claimableEpochs) {
                                console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green('Off Course Yes!!! I will claim for you, wait.'));
                                try {
                                    const tx = await ppv2Contract.claim(haveRound.epoch);

                                    const receipt = await tx.wait();
                                    console.log(receipt)

                                    console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Epoch ${haveRound.epoch.toString()} claimed....Yess`));
                                } catch (e) {
                                    console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.yellow(`Failed to claim, try manually :'(`));
                                }
                                myCache.del('compent')
                            } else {
                                myCache.set('compent', {
                                    position: 1,
                                    amount: haveCompent.amount * parseInt(configs.compentMultiply)
                                })
                                console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.red('Off Course NOT!!! Hahahaaha'));
                            }
                        }

                    }


                    console.log('')
                    console.log(`[ ${moment().format("HH:mm:ss")} ] `, chalk.green(`Start Epoch : ${epoch.toString()}, compensation time!!`));

                    let checkRound = myCache.get('round');
                    if (checkRound.dataMethod.length >= 1) {
                        await betting(checkRound.dataMethod[0], ppv2Contract, epoch, parseFloat(haveCompent.amount).toFixed(4).toString());
                        checkRound.dataMethod.splice(0, 1);
                        myCache.set('round', {
                            round: checkRound + 1,
                            dataMethod: checkRound.dataMethod,
                            epoch
                        });
                    } else {
                        await betting(methodToArray[0], ppv2Contract, epoch, parseFloat(haveCompent.amount).toFixed(4).toString());
                        methodToArray.splice(0, 1);
                        myCache.set('round', {
                            round: 1,
                            dataMethod: methodToArray,
                            epoch
                        });
                    }
                }


            }



        });
    });





})();
