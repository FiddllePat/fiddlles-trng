# fiddlles-trng
A TRNG (True Random Number Generator). This package generates a client that connects to a server using Server-Sent Events (SSE). It computes the difference between successive latencies and uses the least significant digit of this difference as a source of real randomness.

## Features

- Able to generate truely random numbers by measuring latency which is unpredictable

## Documentation

```javascript
const trng = require('fiddlles-trng');

const range = [0, 10];

trng.generate_amount(100, range, range.length)
    .then(result => {
        console.log(result);
        process.exit(0); 
    });
```

Will generate 100 random numbers from 0 to 10
