# CryptoTerminal API Server

[![Build Status](https://travis-ci.org/samotari/ct-api-server.svg?branch=master)](https://travis-ci.org/samotari/ct-api-server) [![Status of Dependencies](https://david-dm.org/samotari/ct-api-server.svg)](https://david-dm.org/samotari/ct-api-server)

API server for the CryptoTerminal mobile application.

* Public API Documentation:
	* [HTTP API Reference](https://github.com/samotari/ct-api-server/blob/master/docs/http-api-reference.md)
	* [Using the Websocket API](https://github.com/samotari/ct-api-server/blob/master/docs/using-the-websocket-api.md)


## Running Your Own Instance

The ct-api-server is a Node.js application that can be run locally (for testing) or on your own publicly accessible server.

### Requirements

The requirements differ based on the cryptocurrencies that you wish to support.

* [nodejs](https://nodejs.org/) - For Linux and Mac install node via [nvm](https://github.com/creationix/nvm).
* For Bitcoin:
	* [electrum](https://electrum.org/) - Used for the following:
		* Getting unspent transaction outputs
		* Getting the current network fee rate estimate
		* Broadcasting raw transactions
	* [bitcoind](https://bitcoin.org/en/download) - Used for receiving real-time transactions.
* For Litecoin:
	* [electrum-ltc](https://electrum-ltc.org/) - Used for the following:
		* Getting unspent transaction outputs
		* Getting the current network fee rate estimate
		* Broadcasting raw transactions
	* [litecoind](https://github.com/litecoin-project/litecoin) - Used for receiving real-time transactions.


### Get the Code

Download the project files via git:
```bash
git clone https://github.com/samotari/ct-api-server.git
```

Install the project's dependencies:
```bash
cd ct-api-server
npm install
```


### Electrum Daemon

The electrum RPC interface is used to get unspent transaction outputs, fee rate, and broadcast raw transactions. If you have not already done so, download and install [electrum](https://electrum.org/#download). Once you've got that, you will need to configure your RPC settings:
```bash
electrum --testnet setconfig rpcuser "user" \
electrum --testnet setconfig rpcport 7777 \
electrum --testnet setconfig rpcpassword "replace with something better"
```
Then start the electrum daemon:
```bash
electrum --testnet daemon start
```
You can use the same steps above to configure and start an electrum daemon for Bitcoin mainnet as well as use electrum-ltc to query the Litecoin network.


### Environment Variables

Below are example environment variables for an instance of the ct-api-server:
```bash
CT_API_SERVER_ELECTRUM='{"bitcoinTestnet":{"uri":"http://localhost:7777","username":"user","password":"replace with something better"}}';
CT_API_SERVER_ZEROMQ='{"bitcoinTestnet":[{"dataUrl":"tcp://127.0.0.1:7000"}]}';
```


### Setup bitcoind with ZeroMQ

Bitcoin core (bitcoind) is used to stream transactions in real-time to the ct-api-server. Use the following guide to install and configure bitcoind:
* [Streaming Transactions from bitcoind via zeroMQ](https://degreesofzero.com/article/streaming-transactions-from-bitcoind-via-zeromq.html)

The above guide can also be used with litecoind.


### Tests

To run the tests, you will need to install the following:
* [mocha](https://mochajs.org/) - `npm install -g mocha`
* [eslint](https://eslint.org/) - `npm install -g eslint`

To run all tests:
```
npm test
```


## License

This project is licensed under the [GNU Affero General Public License v3 (AGPL-3.0)](https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)).
