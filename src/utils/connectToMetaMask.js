import env from "./env"

const connectToMetaMask = async () => {
    let address = false;

    if (window.ethereum) {
        await window.ethereum.request({method: "eth_requestAccounts"}).then(async (accounts) => {
            // Get network ID
            let n = parseInt(window.ethereum.chainId);

            if(n !== ((env === "production") ? 56 : 97)) {
                await switchNetwork();
            }

            address = accounts[0];

            window.ethereum.on('accountsChanged', function (accounts) {
                // Reload the page when the selected account changes
                window.location.reload();
            });
        }).catch((err) => console.log(err))
    } else {
        alert("Please Install Metamask Wallet");
    }

    return address;
};

const switchNetwork = async () => {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: (env === "production") ? "0x38" : "0x61"}],
        });
        console.log("You have switched to the right network")
    } catch (switchError) {
        // The network has not been added to MetaMask
        if (switchError.code === 4902) {
            await addNetwork();
        }
    }
};

const addNetwork = async () => {
    try {
        let params;
        if(env === "production") {
            params = {
                chainId: '0x38',
                chainName:'BNB Smart Chain',
                rpcUrls:['https://bsc.drpc.org/'],
                blockExplorerUrls:['https://bscscan.com/'],
                nativeCurrency: {
                    symbol:'BNB',
                    decimals: 18
                }
            }
        } else {
            params = {
                chainId: '0x61',
                chainName: 'BNB Smart Chain Testnet',
                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
                blockExplorerUrls: ['https://testnet.bscscan.com/'],
                nativeCurrency: {
                    symbol: 'BNB',
                    decimals: 18
                }
            };
        }

        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: params
        });
    } catch (err) {
        console.log(err);
    }
};

export default connectToMetaMask