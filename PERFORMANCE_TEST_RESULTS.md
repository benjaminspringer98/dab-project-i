# Performance test results

## Options

- 10 concurrent users
- 10 sec duration

## Dev performance

1. Loading assignment page:

- http_reqs: 6170
- http_req_duration - median: 14.95ms
- http_req_duration - 99th percentile: 37.3ms

2. Submitting assignment (only tests API)

- http_reqs: 3326
- http_req_duration - median: 21.8ms
- http_req_duration - 99th percentile: 147.39ms

## Prod performance

1. Loading assignment page:

- http_reqs: 121431
- http_req_duration - median: 688µs
- http_req_duration - 99th percentile: 2.79ms

2. Submitting assignment (only tests API)

- http_reqs: 5488
- http_req_duration - median: 13.59ms
- http_req_duration - 99th percentile: 67.82ms

## Thoughts

- page load on prod being faster than dev is expected, as astro build generates
  static files, that are then cached and served by Nginx
- it's interesting to see, that the prod config also improves the performance,
  when calling the API to submit an assignment, even though the dev and prod
  config is almost the same here
