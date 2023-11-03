import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as submissionService from "./services/submissionService.js";
import { serve } from "./deps.js";

import { connect } from "https://deno.land/x/redis/mod.ts";

const redis = await connect({ hostname: "redis", port: 6379 });

const addSubmission = async (request) => {

  const requestData = await request.json();
  console.log("requestData for /api/grade: ", requestData);

  if (await submissionService.userHasPendingSubmission(requestData.user)) {
    return new Response(JSON.stringify({ userHasPending: true }));
  }

  const submissionId = await submissionService.add(requestData.assignment.id, requestData.code, requestData.user);

  const assignment = await programmingAssignmentService.findById(requestData.assignment.id);

  const data = {
    submissionId: submissionId,
    testCode: assignment.test_code,
    code: requestData.code,
  };
  // push into queue for grading instead of using grading api directly
  await redis.lpush("grading_queue", JSON.stringify(data));

  return new Response(JSON.stringify({ message: "received grading request", submissionId: submissionId }));
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

const getSubmissionStatus = async (request, urlPatternResult) => {
  const id = urlPatternResult.pathname.groups.id;
  console.log("getSubmissionStatus: ", id)
  const status = await submissionService.getStatus(id);
  if (status === "pending") {
    return new Response(JSON.stringify({ status }), {
      headers: { "content-type": "application/json" },
    });
  } else if (status === "processed") {
    const submission = await submissionService.findById(id);
    return new Response(JSON.stringify(submission), {
      headers: { "content-type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ status: "unknown" }), {
      headers: { "content-type": "application/json" },
    });
  }

};

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
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/submission/:id/status" }),
    fn: getSubmissionStatus,
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
