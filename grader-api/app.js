import { grade } from "./services/gradingService.js";
import { connect } from "./deps.js";

const redis = await connect({ hostname: "redis-queue", port: 6379 });

const SERVER_ID = crypto.randomUUID();
let counter = 0;

async function processQueue() {
  while (true) {
    const serializedData = await redis.sendCommand("BRPOP", ["grading_queue", 10]);

    if (serializedData) {
      const data = JSON.parse(serializedData[1]);
      console.log(`SERVER ${SERVER_ID} grading submission with id: ${data.submissionId}`);

      const graderFeedback = await grade(data.code, data.testCode);
      const isCorrect = isCorrectResponse(graderFeedback);

      const response = await fetch(`http://programming-api:7777/assignments/${data.assignmentId}/submissions/${data.submissionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ graderFeedback, isCorrect }),
      });
      counter++;
    } else {
      console.log("No data in queue, waiting...");
      console.log(`SERVER ${SERVER_ID} counter ${counter}`);
    }
  }
}

processQueue();

const isCorrectResponse = (result) => {
  const errorKeywords = ["error", "traceback"];
  for (let keyword of errorKeywords) {
    if (result.toLowerCase().includes(keyword)) {
      return false;
    }
  }

  const lines = result.split('\n').map(line => line.trim());
  // Check if any line is exactly "OK"
  for (let line of lines) {
    if (line === "OK") {
      return true;
    }
  }

  return false;
}
