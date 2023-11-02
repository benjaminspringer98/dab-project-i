import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as submissionService from "./services/submissionService.js";
import { serve } from "./deps.js";

import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "redis", port: 6379 });

const addSubmission = async (request) => {
  const requestData = await request.json();
  console.log("requestData for /api/grade: ", requestData);

  const submissionId = await submissionService.add(requestData.assignment.id, requestData.code, requestData.user);

  const assignment = await programmingAssignmentService.findById(requestData.assignment.id);

  const data = {
    submissionId: submissionId,
    testCode: assignment.test_code,
    code: requestData.code,
  };
  // push into queue for grading instead of using grading api directly
  await redis.lpush("grading_queue", JSON.stringify(data));

  // const response = await fetch("http://grader-api:7000/", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(data),
  // });

  //return response;
  return new Response(JSON.stringify({ result: "moin" }));
};

const fetchCurrentAssignment = async (request) => {
  const requestData = await request.json();
  console.log("requestData for /api/assignment: ", requestData);
  const currentAssignmentId = await submissionService.findCurrentAssignmentIdByUserUuid(requestData.user);
  console.log("currentAssignmentId: ", currentAssignmentId);
  const currentAssignment = await programmingAssignmentService.findById(currentAssignmentId);
  console.log("currentAssignment: ", currentAssignment);
  return new Response(JSON.stringify(currentAssignment), {
    headers: { "content-type": "application/json" },
  });
}

const updateSubmission = async (request, urlPatternResult) => {
  const id = urlPatternResult.pathname.groups.id;
  const requestData = await request.json();
  await submissionService.update(id, requestData.graderFeedback, requestData.isCorrect);
}

const urlMapping = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submission" }),
    fn: addSubmission,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submission/:id" }),
    fn: updateSubmission,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignment" }),
    fn: fetchCurrentAssignment,
  },
]

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  try {
    return await mapping.fn(request, mappingResult);
  } catch (e) {
    console.log(e);
    return new Response(e.stack, { status: 500 })
  }
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
