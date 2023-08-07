import { Modal } from 'react-bootstrap'
import { useState } from "react";

// blockchain
import connectToMetaMask from "../../utils/connectToMetaMask";
import contract from "../../utils/contract";
import web3 from "../../utils/web3"

// images
// import twitter from '../../img/twitter.png';

function Home(props) {
    const [inputsValues, setInputsValues] = useState({
        addressIsConnected: false,
        stakeAmount: 1,
        stakingOption: "0",
        balance: 0,
        balanceFormatted: "0",
        stakes: [],
    })

    // Modals
    const [showModalStake, setShowModalStake] = useState(false);
    const handleCloseModalStake = () => setShowModalStake(false);
    const handleShowModalStake = () => setShowModalStake(true);
    const [showModalProcessing, setShowModalProcessing] = useState(false);
    const handleCloseModalProcessing = () => setShowModalProcessing(false);
    const handleShowModalProcessing = () => setShowModalProcessing(true);
    const [showModalSuccess, setShowModalSuccess] = useState(false);
    const handleCloseModalSuccess = () => setShowModalSuccess(false);
    const handleShowModalSuccess = () => setShowModalSuccess(true);
    const [showModalError, setShowModalError] = useState(false);
    const handleCloseModalError = () => setShowModalError(false);
    const handleShowModalError = () => setShowModalError(true);

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

    let connectWallet = async function() {
        document.getElementById('connect-wallet').innerHTML = "CONNECTING";

        let address = await connectToMetaMask();

        if(address) {
            getAddressDetails(address);
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
                            });
                        });
                }
            });

        newInputsValues = { ...newInputsValues, balance: balance, balanceFormatted: numberFormat(balance, false), stakes: stakes, };
        setInputsValues(newInputsValues);
    };

    let stakeShowModal = async function() {
        let address = await connectToMetaMask();

        if(address) {
            getAddressDetails(address);
            handleShowModalStake();
        }
    };

    let stake = async function() {
        let address = await connectToMetaMask();

        if(address) {
            let stakeAmount = web3.utils.toWei((inputsValues.stakeAmount).toString(), 'ether');
            let durationIndex = parseInt(inputsValues.stakingOption);

            try {
                await contract.methods.stakeTokens(stakeAmount, durationIndex).send({
                    from: address
                }).on('transactionHash', function(hash) {
                    handleCloseModalStake();
                    handleShowModalProcessing();
                }).on('error', function(error) {
                    handleCloseModalStake();
                    handleShowModalError();
                    document.getElementById('error-message').innerHTML = error.message;
                }).then(async function(receipt) {
                    await getAddressDetails(address);

                    handleCloseModalProcessing();
                    handleShowModalSuccess();

                    document.getElementById('success-message').innerHTML = "You have successfully staked " + numberFormat(inputsValues.stakeAmount, false) + " TUSK.";
                });
            } catch (e) {}
        } else {
            handleShowModalError();
            document.getElementById('error-message').innerHTML = "Invalid Address";
        }
    };

    let unstake = async function(stakeIndex) {
        let address = await connectToMetaMask();

        if(address) {
            try {
                await contract.methods.withdrawAndClaim(stakeIndex).send({
                    from: address
                }).on('transactionHash', function(hash) {
                    handleCloseModalStake();
                    handleShowModalProcessing();
                }).on('error', function(error) {
                    handleCloseModalStake();
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
            handleShowModalError();
            document.getElementById('error-message').innerHTML = "Invalid Address";
        }
    };

    return (
        <div className="home bg-white">
            <div className="container">
                <div className="row justify-content-center align-items-center min-vh-100">
                    <div className="col-lg-10 col-xl-8 col-xxl-7">
                        <div className="row justify-content-center mb-4">
                            {
                                !inputsValues.addressIsConnected &&
                                <div className="col-md-6">
                                    <button type="button" className="btn btn-custom-1 px-5 py-3 font-size-110 w-100" id="connect-wallet" onClick={connectWallet}>CONNECT WALLET</button>
                                </div>
                            }

                            <div className={ !inputsValues.addressIsConnected ? 'col-md-6' : 'col-md-12' }>
                                <button type="button" className="btn btn-custom-1 px-5 py-3 font-size-110 w-100" onClick={stakeShowModal}>STAKE NOW</button>
                            </div>
                        </div>

                        {
                            inputsValues.addressIsConnected &&
                            <div>
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <p className="text-center mb-0">Balance</p>
                                        <p className="text-center fw-bold font-size-120 mb-0">{ inputsValues.balanceFormatted } TUSK</p>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body">
                                        <p className="text-center mb-3">Stakes</p>
                                        {
                                            inputsValues.stakes.length > 0 ?
                                            <div className="table-responsive">
                                                <table className="table table-bordered mb-2">
                                                    <thead>
                                                        <tr>
                                                            <th className="font-size-90">Amount</th>
                                                            <th className="font-size-90">Duration</th>
                                                            <th className="font-size-90">Started</th>
                                                            <th className="font-size-90">Accumulated Rewards</th>
                                                            <th className="font-size-90">Status</th>
                                                            <th className="font-size-90">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {inputsValues.stakes.map((stake, index) => (
                                                        <tr key={ index }>
                                                            <td className="align-middle text-end">{ numberFormat(web3.utils.fromWei(stake.amount, 'ether'), false) } TUSK</td>
                                                            <td className="align-middle">{ stake.duration / 30 } Months</td>
                                                            <td className="align-middle">{ new Date(stake.startTime * 1000).toLocaleDateString('en-US', {month: 'long', day: '2-digit', year: 'numeric'}) }</td>
                                                            <td className="align-middle text-end">{ numberFormat(web3.utils.fromWei(stake.reward, 'ether'), false) } TUSK</td>
                                                            <td className="align-middle">{ (stake.claimed) ? 'Claimed' : ((new Date() > new Date(stake.startTime * 1000) + (stake.duration * 24 * 60 * 60 * 1000)) ? 'Completed' : 'Ongoing') }</td>
                                                            <td className="align-middle text-center">
                                                                {
                                                                    !stake.claimed &&
                                                                    <button className="btn btn-custom-1 btn-sm" onClick={() => unstake(stake.index)}>{ (new Date() > new Date(stake.startTime * 1000) + (stake.duration * 24 * 60 * 60 * 1000)) ? 'Claim' : 'Unstake' }</button>
                                                                }
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            :
                                            <p className="text-center fw-bold mb-2">You have no stakes yet.</p>
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>

            <Modal show={showModalStake} onHide={handleCloseModalStake} className="" centered>
                <div className="modal-body p-5 border-0">
                    <p className="text-center fw-bold font-size-130">STAKE YOUR MEMELON TUSK</p>

                    <div className="mb-4">
                        <label htmlFor="" className="col-form-label w-100">Staking Options:</label>

                        <div className="row">
                            <div className="col-6">
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="stakingOption" value="0" id="option1" checked={inputsValues.stakingOption === "0"} onChange={handleInputChange} />
                                    <label className="form-check-label" htmlFor="option1">
                                        3 Months | 7.5%
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="stakingOption" value="1" id="option2" checked={inputsValues.stakingOption === "1"} onChange={handleInputChange} />
                                    <label className="form-check-label" htmlFor="option2">
                                        6 Months | 15%
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="stakingOption" value="2" id="option3" checked={inputsValues.stakingOption === "2"} onChange={handleInputChange} />
                                    <label className="form-check-label" htmlFor="option3">
                                        9 Months | 22.5%
                                    </label>
                                </div>
                            </div>

                            <div className="col-6">
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="stakingOption" value="3" id="option4" checked={inputsValues.stakingOption === "3"} onChange={handleInputChange} />
                                    <label className="form-check-label" htmlFor="option4">
                                        12 Months | 30%
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="stakingOption" value="4" id="option5" checked={inputsValues.stakingOption === "4"} onChange={handleInputChange} />
                                    <label className="form-check-label" htmlFor="option5">
                                        24 Months | 60%
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 pb-3">
                        <label htmlFor="" className="col-form-label w-100">Quantity:</label>
                        <input type="number" className="form-control fw-bold text-center font-size-120" name="stakeAmount" min="1" value={inputsValues.stakeAmount} onChange={handleInputChange} />
                        <small>Balance: {inputsValues.balanceFormatted} TUSK</small>
                    </div>

                    <div className="text-center">
                        <button type="button" className="btn btn-custom-1 fw-bold px-5 py-2 font-size-110 mx-1" onClick={handleCloseModalStake}>Close</button>
                        <button type="button" className="btn btn-custom-1 fw-bold px-5 py-2 font-size-110 mx-1" onClick={stake}>Stake</button>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalProcessing} onHide={handleCloseModalProcessing} className="" backdrop="static" keyboard={false} centered>
                <div className="modal-body p-5">
                    <div className="text-center">
                        <div className="spinner-grow mb-3" style={{"width":"5rem", "height":"5rem"}} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mb-0 fw-bold font-size-110 mb-2">Processing your transaction</p>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalSuccess} onHide={handleCloseModalSuccess} className="" centered>
                <div className="modal-body p-5 border-0">
                    <div className="text-center">
                        <i className="fas fa-check-circle font-size-400 text-color-1 mb-3"></i>
                        <p className="mb-0 fw-bold font-size-110 mb-4 pb-2" id="success-message"></p>

                        <button className="btn btn-custom-1 fw-bold px-5 py-2 font-size-110 mx-1" onClick={handleCloseModalSuccess}>Okay</button>
                    </div>
                </div>
            </Modal>

            <Modal show={showModalError} onHide={handleCloseModalError} className="" centered>
                <div className="modal-body p-5">
                    <div className="text-center">
                        <i className="fas fa-times-circle font-size-400 text-color-1 mb-3"></i>
                        <p className="mb-0 fw-bold font-size-110 mb-4 pb-2" id="error-message"></p>

                        <button className="btn btn-custom-1 fw-bold px-5 py-2 font-size-110 mx-1" onClick={handleCloseModalError}>Close</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Home