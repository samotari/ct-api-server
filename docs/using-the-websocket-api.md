# Using the Websocket API

A technical guide to using the application server's websocket API.


## Getting Started

The API server provides a websocket interface via [primus](https://github.com/primus/primus).


### From the Browser

You will first need to include the primus client library in your web page (or app):
```html
<script src="https://ct-api.degreesofzero.com/primus/primus.js"></script>
```

Then open a socket connection to the server:
```js
var primus = Primus.connect('https://ct-api.degreesofzero.com/primus');

primus.once('open', function() {
	console.log('successfully opened websocket connection');
});

primus.once('error', function(error) {
	console.log('failed to open websocket connection', error);
});
```
Once you have connected to the server, you can subscribe to a channel to receive data.


## Channels

List of all available websocket channels.

* [Exchange Rates](#exchange-rates) - Get exchange rate data.
* Bitcoin, Litecoin:
  * [Address Balance Updates](#address-balance-updates) - Get new amounts received by an individual address.
* Monero:
  * [Get Monero Transactions](#get-monero-transactions) - Get recent transactions (from recent blocks and the memory pool).


### Exchange Rates

Get exchange rate data.

`exchange-rates`

Subscribe to channel:
```js
var channel = 'exchange-rates';

primus.write({
	channel: channel,
	action: 'join',
});

primus.on('data', function(data) {
	if (data && data.channel === channel) {
		console.log(data.data);
	}
});
```

Sample data:
```json
{
	"BTC": "1.00000000",
	"CZK": "165860.36",
	"EUR": "6583.00",
	"LTC": "59.11912504",
	"USD": "8094.52",
	"XMR": "40.70832485243232240993"
}
```


### Address Balance Updates

Get new amounts received by an individual address.

`address-balance-updates?address=<ADDRESS>&method=<METHOD>`

Parameters:
* _address_ - The address that you are interested in.
* _method_ - Payment method (network) to listen to. This can be `bitcoin`, `bitcoinTestnet`, or `litecoin`.

Subscribe to channel:
```js
var querystring = require('querystring');
var channel = 'address-balance-updates?' + querystring.stringify({
	address: address,
	method: 'bitcoin'
});

primus.write({
	channel: channel,
	action: 'join',
});

primus.on('data', function(data) {
	if (data && data.channel === channel) {
		console.log(data.data);
	}
});
```

Sample data:
```json
{
	"amount_received": 50000000
}
```
Note that amounts are in whole [satoshis](https://en.bitcoin.it/wiki/Satoshi_(unit)).


### Get Monero Transactions

Get recent transactions (from recent blocks and the memory pool).

`get-monero-transactions?network=<NETWORK>`

Parameters:
* _network_ - This can be `mainnet` or `testnet`.

Subscribe to channel:
```js
var querystring = require('querystring');
var channel = 'get-monero-transactions?' + querystring.stringify({
	network: 'testnet'
});

primus.write({
	channel: channel,
	action: 'join',
});

primus.on('data', function(data) {
	if (data && data.channel === channel) {
		console.log(data.data);
	}
});
```

Sample data:
```json
[
	{
		"coinbase": true,
		"extra": "013f491ef525de80eebc2399bb1dde1375db933ccd19dc51d476fb0c218f063ff2",
		"mixin": 0,
		"payment_id": "",
		"payment_id8": "",
		"rct_type": 0,
		"tx_fee": 0,
		"tx_hash": "1aea28099b98cd4262f16d903247b911c7b773039935955c7986338e9535b225",
		"tx_size": 85,
		"tx_version": 2,
		"xmr_inputs": 0,
		"xmr_outputs": 8063849809903
	},
	{
		"coinbase": false,
		"extra": "01f13c397b2bce06a39ba4c7fe5e7e8ed43b8e6aa8b79aec6adf7e8fc2b97b291a01f13c397b2bce06a39ba4c7fe5e7e8ed43b8e6aa8b79aec6adf7e8fc2b97b291a",
		"mixin": 7,
		"payment_id": "",
		"payment_id8": "",
		"rct_type": 2,
		"tx_fee": 18062800000,
		"tx_hash": "e34e5ba1aadcd031bbeda311c52137ee3b5fb07f9eeb15ebcd0d3f39e22e91e0",
		"tx_size": 13821,
		"tx_version": 2,
		"xmr_inputs": 0,
		"xmr_outputs": 0
	}
]
```
