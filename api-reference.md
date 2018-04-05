# API Reference

A technical guide to using the application server's HTTP API.


## Response Codes

Possible response codes and their meanings.

Code |  | Meaning
---- | ---- | -------
200 | OK | The request was successful.
400 | Bad Request | There was a problem with the request. Look at the errors in the response data to see what must be fixed.
500 | Internal Server Error | Some unexpected error occurred in the server application. More information about the problem can be found in the server component's error log.


## End-Points

List of all available API end-points.

* [Exchange Rates](#exchange-rate) - Get exchange rate data for the given currency.
* [Monero Mempool](#monero-mempool) -  Get monero mempool.
* [Monero Transactions](#monero-transactions) - Get recent confirmed transactions.
* [Monero Outputs](#monero-outputs) - Get outputs of the transaction using private view key.


### Exchange Rates

Get exchange rate data for the given currency.

Verb | URI
--- | ---
GET | /api/v1/exchange-rates

Example using cURL:
```
curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3000/api/v1/exchange-rates?currency=LTC
```

On success, the response will look something like this:
```json
{
	"BTC":"0.01873500",
	"CZK":"3272.22",
	"EUR":"129.32",
	"USD":"159.00",
	"XMR":"0.77434730189459866408"
}
```

### Monero Mempool

Get monero mempool

Verb | URI
--- | ---
GET | /api/v1/monero/mempool

Example using cURL:
```
curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3000/api/v1/monero/mempool?network=testnet
```

On success, the response will look something like this:
```json
{
	"data": {
		"limit":100000000,
		"page":0,
		"total_page_no":0,
		"txs": [
			{
			"coinbase":false,
			"extra":"01361b58e458b92cfbb867a3d425f99e9a22c090e9522ca4986af48d82bbabe195",
			"mixin":5,
			"payment_id":"",
			"payment_id8":"",
			"rct_type":1,
			"timestamp":1522083518,
			"timestamp_utc":"2018-03-26 16:58:38",
			"tx_fee":10236720000,
			"tx_hash":"0e33c10e8fab0dde92ee28f726210dccbcd80b5664c5ab3777af0e178fa6ee4f",
			"tx_size":13058,
			"tx_version":2,
			"xmr_inputs":0,
			"xmr_outputs":0
			}
		],
		"txs_no":1
	},
	"status":"success"
}
```

## Monero Transactions

Get recent confirmed transactions.

Verb | URI
--- | ---
GET | /api/v1/monero/transactions

```
curl -X GET -H "Accept: application/json" -H "application/json" http://localhost:3000/api/v1/monero/transactions?network=testnet
```

```json
{
	"data": {
		"blocks": [
			{
				"age":"00:00:22",
				"hash":"5d2d8e022cec50f3123f8a38fa6e4d6faf25e7482637acf410ff8a4c4f71396e",
				"height":1068998,
				"size":85,
				"timestamp":1522180539,
				"timestamp_utc":"2018-03-27 19:55:39",
				"txs": [
					{
						"coinbase":true,
						"extra":"01a660f210a0961aaecbef5dd7a1a2a3d7d8d0ead5d48c26a8d6fb05533e9d2695",
						"mixin":0,
						"payment_id":"",
						"payment_id8":"",
						"rct_type":0,
						"tx_fee":0,
						"tx_hash":"18b07fd9ae4bb88abaecf1726488ca2592d2f3be7ed67c0a9905d4f757efa721","tx_size":85,
						"tx_version":2,
						"xmr_inputs":0,
						"xmr_outputs":8309816840385
					}
				]
			}
		],
		"current_height": 1068999,
		"limit": 25,
		"page": 0,
		"total_page_no": 42759
	},
	"status":"success"
}
```

## Monero Outputs

Get outputs of the transaction using private view key.


Verb | URI
--- | ---
GET | /api/v1/monero/outputs

Example using cURL:
```
curl -X GET -H "Accept: application/json" -H "application/json" http://localhost:3000/api/v1/monero/outputs?network=testnet&txhash=605e2ec5a5d13e41bd221761334e972824ae96e28309a9b5db178e18fa3ab77c&address=9xmkWjzAB8JguD7JvkJxPHgMwkf7VP5v3Z5eSNmRMdoeCEnoVu6eGUbZT3FQ3Q8XrGihNEbb4qGhqHHGK5kWy9chU3URbaF&viewkey=136674e3e6868bb04d4ef2674f97c00166f5f7aa67185bdda97cde8ecfe4f609&txprove=0
```

On success, the response will look something like this:
```json
{
	"data":{
		"address":"93e9391716a007ee8c239762ab7980eb531d1fd137ba84bfcb5ab5b3985681432fa6a37e5095f4c1ffe34726694ce9f948adc587dc224c6155905c58eeaba6ef",
		"outputs":[
			{
				"amount":8309927789256,
				"match":false,
				"output_idx":0,
				"output_pubkey":"9e1160793266a1791d59b1f9a07ae2f6a56540c69b1e54a34fc98860814e261f"
			}
		],
		"tx_hash":"605e2ec5a5d13e41bd221761334e972824ae96e28309a9b5db178e18fa3ab77c",
		"tx_prove":false,
		"viewkey":"136674e3e6868bb04d4ef2674f97c00166f5f7aa67185bdda97cde8ecfe4f609"
	},
	"status":"success"
}
```