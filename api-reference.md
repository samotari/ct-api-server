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


### Exchange Rates

Get exchange rate data for the given currency.

Verb | URI
--- | ---
GET | /api/v1/exchange-rates

Example using cURL:
```
curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3600/api/v1/exchange-rates?currency=LTC
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
### Status

Check the status of the application server API.

Verb | URI
--- | ---
GET | /api/v1/status

```
curl -X GET -H "Accept: application/json" -H "Content-Type: application/json" http://localhost:3600/api/v1/status
```

On success:
```json
{
	"status":"OK"
}
```


