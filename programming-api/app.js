import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as submissionService from "./services/submissionService.js";
import { serve, connect } from "./deps.js";
import { cacheMethodCalls } from "./utils/cacheUtils.js";

const redis = await connect({ hostname: "redis-queue", port: 6379 });

const cachedProgrammingAssignmentService = cacheMethodCalls(programmingAssignmentService, [""]);
const cachedSubmissionService = cacheMethodCalls(submissionService, ["add", "update"]);


const getAllAssignments = async () => {
  const assignments = await cachedProgrammingAssignmentService.findAll();
  console.log("assignments: ", assignments);
  return new Response(JSON.stringify(assignments), {
    headers: { "content-type": "application/json" },
  });
}

const getAssignment = async (request, urlPatternResult) => {
  const assignmentId = urlPatternResult.pathname.groups.id;
  const assignment = await cachedProgrammingAssignmentService.findById(assignmentId);
  console.log("assignment: ", assignment);
  return new Response(JSON.stringify(assignment), {
    headers: { "content-type": "application/json" },
  });
}

const fetchNextAssignment = async (request) => {
  const requestData = await request.json();
  console.log("requestData for /api/assignments/next: ", requestData);

  const nextAssignment = await cachedProgrammingAssignmentService.findNextByOrder(requestData.order);
  if (!nextAssignment) {
    return new Response(JSON.stringify(false));
  }

  return new Response(JSON.stringify(nextAssignment), {
    headers: { "content-type": "application/json" },
  });
}

const addSubmission = async (request, urlPatternResult) => {
  const requestData = await request.json();
  console.log("requestData for /api/grade: ", requestData);

  if (await cachedSubmissionService.userHasPendingSubmission(requestData.user)) {
    return new Response(JSON.stringify({ userHasPending: true }));
  }
  const assignmentId = urlPatternResult.pathname.groups.id;
  const submissionId = await cachedSubmissionService.add(assignmentId, requestData.code, requestData.user);
  const assignment = await cachedProgrammingAssignmentService.findById(assignmentId);

  const data = {
    assignmentId: assignmentId,
    submissionId: submissionId,
    testCode: assignment.test_code,
    code: requestData.code,
  };
  // push into queue for grading instead of using grading api directly
  await redis.lpush("grading_queue", JSON.stringify(data));

  return new Response(JSON.stringify({ message: "received grading request", submissionId: submissionId }));
};

const fetchNextUncompletedAssignment = async (request) => {
  const requestData = await request.json();
  console.log("requestData for /api/assignment: ", requestData);

  const currentAssignmentId = await cachedProgrammingAssignmentService.findNextUncompletedForUser(requestData.user);
  if (!currentAssignmentId) {
    return new Response(JSON.stringify(false));
  }
  const currentAssignment = await cachedProgrammingAssignmentService.findById(currentAssignmentId);
  return new Response(JSON.stringify(currentAssignment), {
    headers: { "content-type": "application/json" },
  });
}

const updateSubmission = async (request, urlPatternResult) => {
  const submissionId = urlPatternResult.pathname.groups.sId;
  const requestData = await request.json();
  console.log("requestData to update submission", requestData)
  await cachedSubmissionService.update(submissionId, requestData.graderFeedback, requestData.isCorrect);
}

const calculateUserPoints = async (request) => {
  const requestData = await request.json();
  console.log("requestData for /api/points: ", requestData);

  const points = await cachedSubmissionService.getPoints(requestData.user);
  console.log("points: ", points)
  return new Response(JSON.stringify({ points }), {
    headers: { "content-type": "application/json" },
  });
}

const getSubmissionStatus = async (request, urlPatternResult) => {
  const submissionId = urlPatternResult.pathname.groups.sId;
  const status = await cachedSubmissionService.getStatus(submissionId);
  if (status === "pending") {
    return new Response(JSON.stringify({ status }), {
      headers: { "content-type": "application/json" },
    });
  } else if (status === "processed") {
    const submission = await cachedSubmissionService.findById(submissionId);
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
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments" }),
    fn: getAllAssignments,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments/:id" }),
    fn: getAssignment,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignments/next" }),
    fn: fetchNextAssignment,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignments/:id/submissions" }),
    fn: addSubmission,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignments/:aId/submissions/:sId" }),
    fn: updateSubmission,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignments/nextUncompleted" }),
    fn: fetchNextUncompletedAssignment,
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments/:aId/submissions/:sId/status" }),
    fn: getSubmissionStatus,
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/points" }),
    fn: calculateUserPoints,
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
