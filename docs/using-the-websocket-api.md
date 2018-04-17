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


### Exchange Rates

Get exchange rate data.

* _Channel name_ - `exchange-rates`

Subscribe to channel:
```js
primus.write({
	channel: 'exchange-rates',
	action: 'join',
});

primus.on('data', function(data) {
	if (data && data.channel === 'exchange-rates') {
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
