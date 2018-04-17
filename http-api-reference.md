# HTTP API Reference

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

* [Monero Outputs](#monero-outputs) - Get the transaction outputs which belong to the given address and corresponding private view key.
* [Status](#status) - Check the status of the API server.


### Monero Outputs

Get the transaction outputs which belong to the given address and corresponding private view key.

Verb | URI
--- | ---
GET | /api/v1/monero/outputs

Parameters:
* _network_ - This can be `mainnet` or `testnet`.
* _txhash_ - The txhash of the transaction to be checked.
* _address_ - The public address that you are interested in.
* _viewkey_ - The private view key which is needed to decode the transaction outputs.

Example using cURL:
```
curl -X GET -H "Accept: application/json" http://localhost:3600/api/v1/monero/outputs?network=testnet&txhash=<TX_HASH>&address=<ADDRESS>&viewkey=<PRIVATE_VIEW_KEY>
```

On success, the response will look something like this:
```json
{
	"data": {
		"address": "6adfb2d2cb94ed7ffd946f4a069c6477f4e31045a5762c84017e5e1b984c714ce89dea83b23fd6c4c097aa72df79a137b4dbdba913334bb6dec84f4f5823ae7c",
		"outputs": [
			{
				"amount": 10000000000,
				"match": false,
				"output_idx": 0,
				"output_pubkey": "08e84419b8fc122795fd93af6706677ad96bfa562e82aa6ea416a3a483a86605"
			},
			{
				"amount": 70000000000,
				"match": false,
				"output_idx": 1,
				"output_pubkey": "765383137d77847e2565bbcc59e10bfeafbe2c16e13b55e00c82db76cc632838"
			},
			{
				"amount": 300000000000,
				"match": false,
				"output_idx": 2,
				"output_pubkey": "03a945dd210b1420f7c49ae8a96afab25a44e0568bb670249976ea6ab3d62d8f"
			},
			{
				"amount": 700000000000,
				"match": false,
				"output_idx": 3,
				"output_pubkey": "4b39d84508723ab02a5865016120e103941e9fd2a6601b4cc781af76ef93fe16"
			},
			{
				"amount": 2000000000000,
				"match": false,
				"output_idx": 4,
				"output_pubkey": "386b13daad771021f503003e454a8b1c7cc3ffbbb6dbcc92d78ceebd2ae7a385"
			},
			{
				"amount": 7000000000000,
				"match": false,
				"output_idx": 5,
				"output_pubkey": "2c3e79a1a6bfcebfe347dff499800695c0cb6ee4ccb219e3201849ca8a2d9005"
			}
		],
		"tx_hash": "a5e50d89d4261036faf3d6d32f321e71ec8d810c64f268f321a3fe0cf8ee7968",
		"tx_prove": false,
		"viewkey": "52aa4c69b93b780885c9d7f51e6fd5795904962c61a2e07437e130784846f70d"
	},
	"status": "success"
}
```


### Status

Check the status of the application server API.

Verb | URI
--- | ---
GET | /api/v1/status

```
curl -X GET -H "Accept: application/json" http://localhost:3600/api/v1/status
```

On success:
```json
{
	"status":"OK"
}
```
