# JMeter Performance Testing

## Overview
This directory contains JMeter test plans for performance testing the Airbnb application.

## Test Plans

### 1. Authentication Test Plan (`auth-test.jmx`)
- Tests user login and signup endpoints
- Simulates concurrent user authentication
- Measures response times and error rates

### 2. Property Search Test Plan (`property-search-test.jmx`)
- Tests property search and filtering
- Tests property details retrieval
- Measures search performance under load

### 3. Booking Flow Test Plan (`booking-flow-test.jmx`)
- Tests booking creation
- Tests booking status updates
- Simulates concurrent bookings

## Test Scenarios

### Concurrent User Loads
- 100 concurrent users
- 200 concurrent users
- 300 concurrent users
- 400 concurrent users
- 500 concurrent users

## Running Tests

### Prerequisites
```bash
# Install JMeter
brew install jmeter  # macOS
# or download from https://jmeter.apache.org/download_jmeter.cgi
```

### Run Test Plan
```bash
jmeter -n -t booking-flow-test.jmx -l results.jtl -e -o report/
```

### Generate Report
```bash
jmeter -g results.jtl -o report/
```

## Metrics to Analyze
- Average Response Time
- Throughput (requests/second)
- Error Rate
- 90th/95th/99th Percentile Response Times
- Active Threads Over Time

## Expected Results
- Response time should remain under 2 seconds for 95% of requests
- Error rate should be < 1%
- Throughput should scale with concurrent users

## Analysis
Include in report:
- Graph of average response time vs concurrent users
- Analysis of performance bottlenecks
- Recommendations for optimization

