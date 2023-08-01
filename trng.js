const express = require('express');
const EventSource = require('eventsource');

let servers;

async function startServers(ports) {
    servers = await Promise.all(ports.map(port => startServer(port)));
}

async function stopServers() {
    await Promise.all(servers.map(server => stopServer(server)));
}

async function startServer(port) {
    const app = express();

    app.get('/trng', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        setInterval(() => {
            const nanotime = process.hrtime.bigint();
            res.write(`data: ${nanotime.toString()}\n\n`);
        }, 2);
    });

    const server = app.listen(port);
    await new Promise((resolve) => server.on('listening', resolve));
    server.port = port;
    return server;
}

async function stopServer(server) {
    return new Promise((resolve) => {
        server.close(resolve);
    });
}

async function generate(port) {
    let result = await measure(port);
    return Number(result);
}

async function generate_amount(x, range, numDigits = 1, ports = [58767]) {
    await startServers(ports);
    const numbers = [];
    
    for (let i = 0; i < x; i++) {
        let digitStrings = [];
        for (let j = 0; j < numDigits; j++) {
            let num = await generate(ports[j % ports.length]);
            digitStrings.push(num);
        }
        
        let num = combineDigitsIntoNumber(digitStrings, range[0], range[1]);
        numbers.push(num);
    }

    await stopServers();
    return numbers;
}

function measure(port) {
    return new Promise((resolve, reject) => {
        var eventSource = new EventSource(`http://localhost:${port}/trng`);
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

function combineDigitsIntoNumber(digitStrings, min, max) {
    let maxes = [];
    for (let i = 0; i < digitStrings.length; i++) {
        maxes.push(Math.pow(10, i) * 9);
    }
    let num = 0;
    for (let i = 0; i < digitStrings.length; i++) {
        num += Number(digitStrings[i]) / 9 * maxes[i];
    }
    num = min + num / maxes.reduce((a, b) => a + b, 0) * (max - min);
    num = Math.round(num);

    return num;
}

module.exports = {
    generate,
    generate_amount
};
