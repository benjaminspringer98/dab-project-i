<script>
  import { userUuid } from "../stores/stores.js";
  import {
    assignmentId,
    assignmentOrder,
    totalAssignments,
  } from "../stores/assignmentStore.js";

  let code = "";
  let message = "";
  let result = "";

  const getAssignment = async () => {
    code = "";
    result = "";
    const data = {
      user: $userUuid,
    };

    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    console.log(json);
    $assignmentId = json.currentAssignment.id;
    $assignmentOrder = json.currentAssignment.assignment_order;
    $totalAssignments = json.assignmentCount;
    return json;
  };

  let assignmentPromise = getAssignment();

  const getNextAssignment = async () => {
    assignmentPromise = getAssignment();
  };

  const submit = async () => {
    message = "Submitting...";
    result = "";
    const data = {
      user: $userUuid,
      code: code,
    };

    const response = await fetch(
      `/api/assignments/${$assignmentId}/submissions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const submission = await response.json();
    console.log(submission);

    if (submission.userHasPending) {
      message = "You have a currently pending submission. Please wait.";
      return;
    }
    pollingManager.start(submission.submissionId, 1);
  };

  const pollingManager = (() => {
    let intervals = new Map(); // Store interval IDs against submission IDs

    const startPolling = (submissionId, interval) => {
      // Clear any existing intervals for this ID to avoid duplicate polling
      if (intervals.has(submissionId)) {
        clearInterval(intervals.get(submissionId));
      }

      const poll = async () => {
        try {
          message = "Waiting for grading...";
          const response = await fetch(
            `/api/assignments/${$assignmentId}/submissions/${submissionId}/status`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const submission = await response.json();
          console.log(submission);

          // Stop polling if the submission is processed
          if (submission.status === "processed") {
            clearInterval(intervals.get(submissionId));
            intervals.delete(submissionId);
            message = "";
            console.log(`Processing complete for submission ${submissionId}!`);
            result = submission;
          }
        } catch (error) {
          console.error(
            `Failed to fetch submission status for ${submissionId}:`,
            error
          );
          // Optionally clear the interval on error, or retry after a delay
        }
      };

      // Set up the interval and store the ID
      intervals.set(submissionId, setInterval(poll, interval * 1000));
    };

    const stopPolling = (id) => {
      if (intervals.has(id)) {
        clearInterval(intervals.get(id));
        intervals.delete(id);
      }
    };

    return {
      start: startPolling,
      stop: stopPolling,
    };
  })();
</script>

{#await assignmentPromise}
  <p>loading...</p>
{:then promise}
  <p>{$assignmentOrder}/{$totalAssignments}</p>
  <p>id:{$assignmentId}</p>
  <h3>{promise.currentAssignment.title}</h3>
  <p>{promise.currentAssignment.handout}</p>
{:catch error}
  <p>error: {error.message}</p>
{/await}

<textarea
  bind:value={code}
  rows="4"
  cols="50"
  class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
/>
<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded m-4"
  on:click={submit}
>
  Submit code
</button>
<p>{message}</p>
{#if result}
  {#if result.correct}
    <p>Correct!</p>
    {#if $assignmentOrder < $totalAssignments}
      <button
        class="bg-green-500 hover:bg-green-700 text-white font-bold p-4 rounded m-4"
        on:click={getNextAssignment}
      >
        Next assignment
      </button>
    {:else}
      <p>You've done all the assignments. Congratz!</p>
    {/if}
  {:else}
    <p>Incorrect</p>
    <p>{result.grader_feedback}</p>
  {/if}
{/if}
