// import { serve } from "./deps.js";
import { connect } from "./deps.js";

const redis = await connect({ hostname: "redis", port: 6379 });

async function processQueue() {
    while (true) {
        const serializedData = await redis.sendCommand("BRPOP", ["grading_queue", 10]);
        //const serializedData = await redis.blpop("grading_queue", 10);
        if (serializedData) {
            const data = JSON.parse(serializedData[1]);
            console.log("found data in queue: ", data);

            const result = await grade(data.code, data.testCode);
            console.log(`Graded code with result: ${result}`);

        }

        console.log("No data in queue");
    }
}

processQueue();

// const portConfig = { port: 8080, hostname: "0.0.0.0" };
// serve(handleRequest, portConfig);