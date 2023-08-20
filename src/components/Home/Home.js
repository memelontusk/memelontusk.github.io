import { Modal } from 'react-bootstrap'
import { useState } from "react";

// blockchain
import connectToMetaMask from "../../utils/connectToMetaMask";
import contract from "../../utils/contract";
import web3 from "../../utils/web3"

// images
import logo from '../../img/logo.png';

function Home(props) {
    const [inputsValues, setInputsValues] = useState({
        addressIsConnected: false,
        address: null,
        stakeAmount: 1,
        stakingOption: 0,
        balance: 0,
        balanceFormatted: "0",
        stakes: [],
        totalStakedAmount: 0,
        totalAccumulatedRewards: 0,
        totalRewardsToBeReceived: 0,
        unstake: {
            amount: "0",
            reward: "0",
            penalty: "0",
            penaltyReward: "0",
        }
    })

    // Modals
    const [showModalProcessing, setShowModalProcessing] = useState(false);
    const handleCloseModalProcessing = () => setShowModalProcessing(false);
    const handleShowModalProcessing = () => setShowModalProcessing(true);
    const [showModalSuccess, setShowModalSuccess] = useState(false);
    const handleCloseModalSuccess = () => setShowModalSuccess(false);
    const handleShowModalSuccess = () => setShowModalSuccess(true);
    const [showModalError, setShowModalError] = useState(false);
    const handleCloseModalError = () => setShowModalError(false);
    const handleShowModalError = () => setShowModalError(true);
    const [showModalPenalty, setShowModalPenalty] = useState(false);
    const handleCloseModalPenalty = () => setShowModalPenalty(false);
    const handleShowModalPenalty = () => setShowModalPenalty(true);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputsValues({ ...inputsValues, [name]: value });
    }

    let numberFormat = function(x, decimal) {
        x = parseFloat(x);
        var parts = x.toFixed(2).toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if(decimal) {
            return parts.join(".");
        } else {
            return parts[0];
        }
    };

    let shortenAddress = function(prefixLength, postfixLength, string) {
        if (prefixLength + postfixLength >= string.length) {
            return string; // Return original string if prefix and postfix lengths are greater or equal to the string length
        }

        const prefix = string.substr(0, prefixLength);
        const postfix = string.substr(-postfixLength);

        return `${prefix}...${postfix}`;
    };

    let connectWallet = async function() {
        document.getElementById('connect-wallet').innerHTML = "CONNECTING";

        let address = await connectToMetaMask();

        if(address) {
            await getAddressDetails(address);
        } else {
            document.getElementById('connect-wallet').innerHTML = "CONNECT WALLET";
        }
    };

    let getAddressDetails = async function(address) {
        let newInputsValues = { ...inputsValues, addressIsConnected: true };
        let balance;

        await contract.methods.balanceOf(address).call()
            .then(function(data) {
                // eslint-disable-next-line no-undef
                balance = parseInt(BigInt(data) / BigInt(1000000000000000000));
            });

        let stakes = [];
        let totalStakedAmount = 0;
        let totalAccumulatedRewards = 0;
        let totalRewardsToBeReceived = 0;

        await contract.methods.getStakeCount(address).call()
            .then(async function(data) {
                let stakeCount = parseInt(data);

                for(let i = stakeCount - 1; i >= 0; i--) {
                    await contract.methods.getStake(address, i).call()
                        .then(function(data) {
                            stakes.push({
                                index: i,
                                amount: data.amount,
                                duration: data.duration,
                                startTime: data.startTime,
                                claimed: data.claimed,
                                reward: data.reward,
                                penalty: data.penalty,
                                penaltyReward: data.penaltyReward,
                                totalWithdrawalAmount: parseInt(web3.utils.fromWei(data.amount, 'ether')) + parseInt(web3.utils.fromWei(data.reward, 'ether')) + parseInt(web3.utils.fromWei(data.penaltyReward, 'ether')) - parseInt(web3.utils.fromWei(data.penalty, 'ether')),
                            });

                            if(!data.claimed) {
                                let percentage;
                                if(parseInt(data.duration) === 90) {
                                    percentage = 0.01875;
                                } else if(parseInt(data.duration) === 180) {
                                    percentage = 0.075;
                                } else if(parseInt(data.duration) === 270) {
                                    percentage = 0.16875;
                                } else if(parseInt(data.duration) === 360) {
                                    percentage = 0.3;
                                } else if(parseInt(data.duration) === 720) {
                                    percentage = 1.2;
                                }

                                totalStakedAmount += parseInt(web3.utils.fromWei(data.amount, 'ether'));
                                totalAccumulatedRewards += parseInt(web3.utils.fromWei(data.reward, 'ether'));
                                totalRewardsToBeReceived += (parseInt(web3.utils.fromWei(data.amount, 'ether')) * percentage) + parseInt(web3.utils.fromWei(data.penaltyReward, 'ether'));
                            }
                        });
                }
            });

        newInputsValues = { ...newInputsValues, balance: balance, balanceFormatted: numberFormat(balance, false), stakes: stakes, address: address, totalStakedAmount: numberFormat(totalStakedAmount, false), totalAccumulatedRewards: numberFormat(totalAccumulatedRewards, false), totalRewardsToBeReceived: numberFormat(totalRewardsToBeReceived, false) };
        setInputsValues(newInputsValues);
    };

    let selectStakingOption = async function(stakeIndex) {
        setInputsValues({ ...inputsValues, stakingOption: stakeIndex });
    };

    let inputMaxBalance = async function() {
        setInputsValues({ ...inputsValues, stakeAmount: inputsValues.balance });
    };

    let stake = async function() {
        let address = await connectToMetaMask();

        if(address) {
            await getAddressDetails(address);

            let stakeAmount = web3.utils.toWei((inputsValues.stakeAmount).toString(), 'ether');
            let durationIndex = parseInt(inputsValues.stakingOption);

            try {
                await contract.methods.stakeTokens(stakeAmount, durationIndex).send({
                    from: address
                }).on('transactionHash', function(hash) {
                    handleShowModalProcessing();
                }).on('error', function(error) {
                    handleShowModalError();
                    document.getElementById('error-message').innerHTML = error.message;
                }).then(async function(receipt) {
                    await getAddressDetails(address);

                    handleCloseModalProcessing();
                    handleShowModalSuccess();

                    document.getElementById('success-message').innerHTML = "You have successfully staked " + numberFormat(inputsValues.stakeAmount, false) + "&nbsp;TUSK.";
                });
            } catch (e) {}
        } else {
            handleShowModalError();
            document.getElementById('error-message').innerHTML = "Invalid Address";
        }
    };

    let unstake = async function(stakeIndex, forced) {
        let address = await connectToMetaMask();

        if(address) {
            for(let i = 0; i < inputsValues.stakes.length; i++) {
                if(inputsValues.stakes[i].index === stakeIndex) {
                    console.log(inputsValues.stakes[i]);
                    if(parseInt(web3.utils.fromWei(inputsValues.stakes[i].penalty, 'ether')) === 0 || forced) {
                        if(forced) {
                            handleCloseModalPenalty();
                        }

                        try {
                            await contract.methods.withdrawAndClaim(stakeIndex).send({
                                from: address
                            }).on('transactionHash', function(hash) {
                                handleShowModalProcessing();
                            }).on('error', function(error) {
                                handleShowModalError();
                                document.getElementById('error-message').innerHTML = error.message;
                            }).then(async function(receipt) {
                                await getAddressDetails(address);

                                handleCloseModalProcessing();
                                handleShowModalSuccess();

                                document.getElementById('success-message').innerHTML = "You have successfully claimed your stake.";
                            });
                        } catch (e) {}
                    } else {
                        setInputsValues({ ...inputsValues, unstake: inputsValues.stakes[i] });
                        handleShowModalPenalty();
                    }
                }
            }
        } else {
            handleShowModalError();
            document.getElementById('error-message').innerHTML = "Invalid Address";
        }
    };

    return (
        <div className="home bg-color-1">
            <nav className="navbar navbar-dark navbar-expand-lg bg-body-tertiary py-2" style={{"borderBottom":"1px solid rgb(48, 50, 68)"}}>
                <div className="container">
                    <a className="navbar-brand text-white d-flex align-items-center" href="#">
                        <div className="pe-4">
                            <img src={logo} width="50" alt="Memelon Tusk" />
                        </div>
                        <div>MEMELON TUSK STAKING</div>
                    </a>

                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                            data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                            aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <a href={ "https://app.uniswap.org/#/swap?inputCurrency=eth&outputCurrency=" + contract.options.address } target="_blank" rel="noreferrer" className="btn btn-custom-3 px-4" >BUY MEMELON TUSK</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="row justify-content-center align-items-center min-vh-100">
                    <div className="col-lg-6 pt-5 py-lg-5 px-3">
                        <div className="bg-color-2 p-4 p-sm-5">
                            <p className="text-white font-size-150">Stake & Earn Today!</p>
                            <p className="text-white font-size-90 font-size-lg-80 font-size-xl-90">Explore diverse staking options tailored to your financial goals. Whether you're looking for short-term gains or long-term growth, we have the perfect plan for you.</p>

                            {
                                !inputsValues.addressIsConnected ?
                                <div className="mb-3">
                                    <button className="btn btn-custom-3 w-100 px-4 py-3" id="connect-wallet" onClick={connectWallet}>CONNECT WALLET</button>
                                </div>
                                :
                                <div className="mb-3">
                                    <div className="text-white w-100 px-4 py-3" style={{"border":"1px solid rgb(48, 50, 68)"}}>Wallet Address:&nbsp;&nbsp;&nbsp;&nbsp;{ shortenAddress(6, 7, inputsValues.address) }</div>
                                </div>
                            }

                            <div className="row mb-3 px-1">
                                <div className="col-6 col-md-4 p-2">
                                    <button className={'btn btn-custom-2 font-size-lg-80 font-size-xl-100 w-100 ' + (inputsValues.stakingOption === 0 ? 'active' : '')} onClick={() => selectStakingOption(0)}>3 MONTHS<br/>7.5% APR</button>
                                </div>
                                <div className="col-6 col-md-4 p-2">
                                    <button className={'btn btn-custom-2 font-size-lg-80 font-size-xl-100 w-100 ' + (inputsValues.stakingOption === 1 ? 'active' : '')} onClick={() => selectStakingOption(1)}>6 MONTHS<br/>15% APR</button>
                                </div>
                                <div className="col-6 col-md-4 p-2">
                                    <button className={'btn btn-custom-2 font-size-lg-80 font-size-xl-100 w-100 ' + (inputsValues.stakingOption === 2 ? 'active' : '')} onClick={() => selectStakingOption(2)}>9 MONTHS<br/>22.5% APR</button>
                                </div>
                                <div className="col-6 col-md-4 p-2">
                                    <button className={'btn btn-custom-2 font-size-lg-80 font-size-xl-100 w-100 ' + (inputsValues.stakingOption === 3 ? 'active' : '')} onClick={() => selectStakingOption(3)}>12 MONTHS<br/>30% APR</button>
                                </div>
                                <div className="col-6 col-md-4 p-2">
                                    <button className={'btn btn-custom-2 font-size-lg-80 font-size-xl-100 w-100 ' + (inputsValues.stakingOption === 4 ? 'active' : '')} onClick={() => selectStakingOption(4)}>24 MONTHS<br/>60% APR</button>
                                </div>
                            </div>

                            <p className="text-white mb-2">Amount to Stake</p>

                            <div className="row px-1 mb-2">
                                <div className="col-lg-8 p-2">
                                    <div className="position-relative">
                                        <div className="position-absolute text-white cursor-pointer" onClick={inputMaxBalance} style={{"top":"16px", "right":"20px"}}>MAX</div>
                                        <input type="number" step="0" min="1" className="form-control form-control-1 ps-4 py-3" name="stakeAmount" placeholder="Enter Stake Amount" value={inputsValues.stakeAmount} onChange={handleInputChange} style={{"paddingRight":"70px"}} />
                                    </div>
                                </div>

                                <div className="col-lg-4 p-2">
                                    <button className="btn btn-custom-3 w-100 px-4 py-3" onClick={stake}>STAKE</button>
                                </div>
                            </div>

                            <p className="text-white mb-0">Balance: { inputsValues.balanceFormatted } TUSK</p>
                        </div>
                    </div>

                    <div className="col-lg-6 py-5 px-3">
                        <div className="pb-3">
                            <div className="bg-color-2 px-4 px-sm-5 right-boxes">
                                <div className="row align-items-center">
                                    <div className="col-sm-9 col-lg-12 col-xl-9">
                                        <p className="text-white font-size-180 mb-0">{ inputsValues.totalStakedAmount } TUSK</p>
                                        <p className="text-white font-size-100 mb-0">Staked Amount</p>
                                    </div>
                                    <div className="col-3 d-none d-sm-block d-lg-none d-xl-block">
                                        <div className="text-center">
                                            <i className="fa-solid fa-steak font-size-400 text-color-1"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-3">
                            <div className="bg-color-2 px-4 px-sm-5 right-boxes">
                                <div className="row align-items-center">
                                    <div className="col-sm-9 col-lg-12 col-xl-9">
                                        <p className="text-white font-size-180 mb-0">{ inputsValues.totalAccumulatedRewards } TUSK</p>
                                        <p className="text-white font-size-100 mb-0">Accumulated Rewards</p>
                                    </div>
                                    <div className="col-3 d-none d-sm-block d-lg-none d-xl-block">
                                        <div className="text-center">
                                            <i className="fa-solid fa-coins font-size-420 text-color-1"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3">
                            <div className="bg-color-2 px-4 px-sm-5 right-boxes">
                                <div className="row align-items-center">
                                    <div className="col-sm-9 col-lg-12 col-xl-9">
                                        <p className="text-white font-size-180 mb-0">{ inputsValues.totalRewardsToBeReceived } TUSK</p>
                                        <p className="text-white font-size-100 mb-0">Rewards By End Of Stake</p>
                                    </div>
                                    <div className="col-3 d-none d-sm-block d-lg-none d-xl-block">
                                        <div className="text-center">
                                            <i className="fa-solid fa-sack-dollar font-size-420 text-color-1"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pb-5 px-1">
                    <p className="text-white font-size-150 mb-3">Stake History</p>
                    <div className="table-responsive">
                        <table className="table text-white mb-2">
                            <thead>
                                <tr className="bg-color-2">
                                    <th className="text-center align-middle p-3">No.</th>
                                    <th className="text-center align-middle p-3">Amount</th>
                                    <th className="text-center align-middle p-3">Duration</th>
                                    <th className="text-center align-middle p-3">Started</th>
                                    <th className="text-center align-middle p-3">Accumulated Rewards</th>
                                    <th className="text-center align-middle p-3">Status</th>
                                    <th className="text-center align-middle p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                inputsValues.stakes.length > 0 ?
                                // false ?
                                    inputsValues.stakes.map((stake, index) => (
                                <tr key={ index }>
                                    <td className="align-middle p-3 text-end inter">{ stake.index + 1 }</td>
                                    <td className="align-middle p-3 text-end inter">{ numberFormat(web3.utils.fromWei(stake.amount, 'ether'), false) } TUSK</td>
                                    <td className="align-middle p-3 text-end inter">{ stake.duration / 30 } Months</td>
                                    <td className="align-middle p-3 text-end inter">{ new Date(stake.startTime * 1000).toLocaleDateString('en-US', {month: 'long', day: '2-digit', year: 'numeric'}) }</td>
                                    <td className="align-middle p-3 inter text-end">{ numberFormat(web3.utils.fromWei(stake.reward, 'ether'), false) } TUSK</td>
                                    <td className="align-middle p-3 inter">{ (stake.claimed) ? 'Claimed' : ((Date.parse(new Date()) > Date.parse(new Date(stake.startTime * 1000)) + (stake.duration * 24 * 60 * 60 * 1000)) ? 'Completed' : 'Ongoing') }</td>
                                    <td className="align-middle p-3 text-center">
                                        {
                                            !stake.claimed &&
                                            <button className="btn btn-custom-3 btn-sm px-3 py-2 w-100" onClick={() => unstake(stake.index, false)}>{ (Date.parse(new Date()) > Date.parse(new Date(stake.startTime * 1000)) + (stake.duration * 24 * 60 * 60 * 1000)) ? 'Claim' : 'Unstake' }</button>
                                        }
                                    </td>
                                </tr>
                                    ))
                                :
                                <tr>
                                    <td className="align-middle p-3 text-center inter" colSpan="12">You have no stakes yet.</td>
                                </tr>
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={showModalProcessing} onHide={handleCloseModalProcessing} className="" backdrop="static" keyboard={false} centered>
                <div className="modal-body p-4 py-5 p-sm-5">
                    <div className="text-center">
                        <div className="spinner-grow mb-3" style={{"width":"5rem", "height":"5rem"}} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mb-0 font-size-110 mb-2">Processing your transaction</p>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalSuccess} onHide={handleCloseModalSuccess} className="" centered>
                <div className="modal-body p-4 py-5 p-sm-5 border-0">
                    <div className="text-center">
                        <i className="fas fa-check-circle font-size-400 text-color-1 mb-3"></i>
                        <p className="mb-0 font-size-110 mb-4 pb-2" id="success-message"></p>

                        <button className="btn btn-custom-3 px-5 py-2 font-size-110 mx-1" onClick={handleCloseModalSuccess}>Okay</button>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalError} onHide={handleCloseModalError} className="" centered>
                <div className="modal-body p-4 py-5 p-sm-5">
                    <div className="text-center">
                        <i className="fas fa-times-circle font-size-400 text-color-1 mb-3"></i>
                        <p className="mb-0 font-size-110 mb-4 pb-2" id="error-message"></p>

                        <button className="btn btn-custom-3 px-5 py-2 font-size-110 mx-1" onClick={handleCloseModalError}>Close</button>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalPenalty} onHide={handleCloseModalPenalty} className="" centered>
                <div className="modal-body p-4 py-5 p-sm-5">
                    <div className="text-center">
                        <i className="fas fa-exclamation-circle font-size-400 text-color-1 mb-3"></i>
                        <p className="mb-0 font-size-110 mb-4 inter pb-2">You are attempting to withdraw your stake ahead of the scheduled time, resulting in a penalty of <span>{ numberFormat(parseInt(web3.utils.fromWei(inputsValues.unstake.penalty, "ether")), false) } TUSK tokens</span>. After applying this penalty, you will receive a total of <span>{ numberFormat(inputsValues.unstake.totalWithdrawalAmount, false) } TUSK tokens</span> from this withdrawal. Please review your decision to ensure that you understand the implications of this early withdrawal.</p>

                        <button className="btn btn-custom-3 inter px-3 px-sm-5 py-2 font-size-100 mx-1" onClick={handleCloseModalPenalty}>Cancel</button>
                        <button className="btn btn-custom-3 inter px-3 px-sm-5 py-2 font-size-100 mx-1" onClick={() => unstake(inputsValues.unstake.index, true)}>Proceed Anyway</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Home