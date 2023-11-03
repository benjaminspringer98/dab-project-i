import { serve } from "./deps.js";
import { grade } from "./services/gradingService.js";

import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "redis", port: 6379 });



const handleRequest = async (request) => {
  // the starting point for the grading api grades code following the
  // gradingDemo function, but does not e.g. use code from the user
  let result;
  try {
    const requestData = await request.json();

    console.log("Request data:");
    console.log(requestData);

    const code = requestData.code;
    const testCode = requestData.testCode;

    result = await grade(code, testCode);
  } catch (e) {
    result = await gradingDemo();
  }

  // in practice, you would either send the code to grade to the grader-api
  // or use e.g. a message queue that the grader api would read and process

  return new Response(JSON.stringify({ result: "moin" }));
};

const SERVER_ID = crypto.randomUUID();
let counter = 0;

async function processQueue() {
  while (true) {
    const serializedData = await redis.sendCommand("BRPOP", ["grading_queue", 10]);

    if (serializedData) {
      const data = JSON.parse(serializedData[1]);
      console.log("found data in queue: ", data);
      console.log(`SERVER ${SERVER_ID} grading submission with id: ${data.submissionId}`);
      const graderFeedback = await grade(data.code, data.testCode);
      //console.log(`Code got result: ${result}`);
      const isCorrect = isCorrectResponse(graderFeedback);


      const response = await fetch(`http://programming-api:7777/submission/${data.submissionId}`, {
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
  const lines = result.split('\n').map(line => line.trim());

  // Check if any line is exactly "OK"
  for (let line of lines) {
    if (line === "OK") {
      return true;
    }
  }

  return false;
}

let state = -1;

const getCode = () => {
  state = (state + 1) % 5;

  if (state == 0) {
    return `
def hello():
  return "Hello world!"
`;
  } else if (state == 1) {
    return `
def hello():
  return "hello world!"
    `;
  } else if (state == 2) {
    return `
def ohnoes():
  return "Hello world!"
    `;
  } else if (state == 3) {
    return `
:D
      `;
  } else {
    return `
while True:
  print("Hmmhmm...")
    `;
  }
};

const gradingDemo = async () => {
  let code = getCode();

  const testCode = `
import socket
def guard(*args, **kwargs):
  raise Exception("Internet is bad for you :|")
socket.socket = guard

import unittest
from code import *

class TestHello(unittest.TestCase):

  def test_hello(self):
    self.assertEqual(hello(), "Hello world!", "Function should return 'Hello world!'")

if __name__ == '__main__':
  unittest.main()  
`;

  return await grade(code, testCode);
};

const portConfig = { port: 7000, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
