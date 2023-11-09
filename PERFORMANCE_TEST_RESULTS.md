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

- http_reqs: 3120
- http_req_duration - median: 24.5ms
- http_req_duration - 99th percentile: 120.17ms

## Prod performance

1. Loading assignment page:

- http_reqs: 121431
- http_req_duration - median: 688µs
- http_req_duration - 99th percentile: 2.79ms

2. Submitting assignment

- http_reqs: 6612
- http_req_duration - median: 10.99ms
- http_req_duration - 99th percentile: 63.24ms

## Thoughts

- it's interesting to see, that the prod config makes such a big difference for
  loading the assignment page
