import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import * as submissionService from "./services/submissionService.js";
import { serve } from "./deps.js";

const grade = async (request) => {
  const programmingAssignments = await programmingAssignmentService.findAll();

  const requestData = await request.json();
  const testCode = programmingAssignments[0]["test_code"];
  console.log("requestData for /api/grade: ", requestData);

  const data = {
    testCode: testCode,
    code: requestData.code,
  };

  await submissionService.add(requestData.assignment.id, requestData.code, requestData.user);

  const response = await fetch("http://grader-api:7000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response;
};

const fetchCurrentAssignment = async (request) => {
  const requestData = await request.json();

  let currentAssignment;
  currentAssignment = await submissionService.findCurrentAssignmentByUserUuid(requestData.user);
  // if no correct submissions, return first assignment
  if (!currentAssignment) {
    currentAssignment = await programmingAssignmentService.findById(1);
  }

  return new Response(JSON.stringify(currentAssignment), {
    headers: { "content-type": "application/json" },
  });
}

const urlMapping = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/grade" }),
    fn: grade,
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
