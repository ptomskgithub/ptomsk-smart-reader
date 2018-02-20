// Allows us to use ES6 in our migrations and tests.
require('babel-register');

var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "young despair robust wood west desert rapid purchase vintage kite ribbon combine misery solid capable";

var provider_live = new HDWalletProvider(mnemonic, "https://mainnet.infura.io/");
var provider_development = new HDWalletProvider(mnemonic, "https://ropsten.infura.io/");

module.exports = {
    networks: {
        development: {
            gas: 3000000,
            gasPrice: 1000000000, // 1 Gwei
            host: "localhost",
            port: 8545,
            network_id: "*" // Match any network id
        },
        live: {
            gas: 1000000,
            gasPrice: 3000000000, // 1 Gwei
            provider: provider_live,
            network_id: 1
        },
        ropsten: {
            gas: 3000000,
            gasPrice: 1000000000, // 1 Gwei
            provider: provider_development,
            network_id: 3 // official id of the ropsten network
        },
        test: {
            gas: 3000000,
            gasPrice: 20000000000, // 4 Gwei
            network_id: 300,
            host: "localhost",
            port: 8545
        }
    }
};
