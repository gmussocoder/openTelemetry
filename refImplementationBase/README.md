
 #### Running to code

 Start by `docker-compose up`

 Then install all dependencies by running `yarn install`
 
 Spin up both services:
 * `yarn items`
 * `yarn users`


Send two API calls:
* `curl http://localhost:8080/data`
* `curl http://localhost:8080/data?fail=1`

#### View traces, logs and metrics:
* View the metrics in prometheus, go to http://localhost:9090 and search for "http_calls_total" - this will show you the count of API calls received by items-service

* To view the traces and logs go to http://localhost:16686/ 