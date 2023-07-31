const express = require('express');
const app = express();
const EventSource = require('eventsource');
app.get('/trng', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    setInterval(() => {
        const nanotime = process.hrtime.bigint();
        res.write(`data: ${nanotime.toString()}\n\n`);
    }, 1);
});
async function trng() {
    await new Promise((resolve) => {
        app.listen(58767, resolve);
    });
    let result = await measure();
    return Number(result);
}
function measure() {
    return new Promise((resolve, reject) => {
        var eventSource = new EventSource('http://localhost:58767/trng');
        let lastLatency = null;
        eventSource.onmessage = function(event) {
            const receivedTime = BigInt(event.data);
            const currentTime = process.hrtime.bigint();
            const latency = currentTime - receivedTime;

            if(lastLatency !== null) {
                const diff = latency - lastLatency;
                const lastDigit = String(diff).slice(-1);
                resolve(lastDigit);
                eventSource.close();
            }
            lastLatency = latency;
        };
        eventSource.onerror = function(error) {
            reject(error);
        };
    });
}
module.exports = trng;
