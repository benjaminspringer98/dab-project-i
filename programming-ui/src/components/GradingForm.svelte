<script>
  import { onMount } from "svelte";
  import { userUuid } from "../stores/stores.js";
  import { points } from "../stores/pointStore.js";
  import { getPoints } from "../utils/getPoints.js";
  import { nextAssignmentId } from "../stores/assignmentStore.js";

  export let assignment;
  export let assignmentCount;

  let code = "";
  let message = "";
  let result = "";

  onMount(async () => {
    $points = await getPoints($userUuid);
    const nextAssignment = await getNextAssignment(assignment.assignment_order);
    $nextAssignmentId = nextAssignment.id;
  });

  const getNextAssignment = async (order) => {
    const response = await fetch("/api/assignments/next", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order }),
    });
    const json = await response.json();
    console.log("json", json);
    return json;
  };

  const isCompleted = async () => {
    const data = {
      user: $userUuid,
    };
    const response = await fetch(
      `/api/assignments/${assignment.id}/isCompleted`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    return await response.json();
  };

  let isCompletedPromise = isCompleted();

  const submit = async () => {
    message = "Submitting...";
    result = "";
    const data = {
      user: $userUuid,
      code: code,
    };

    const response = await fetch(
      `/api/assignments/${assignment.id}/submissions`,
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
            `/api/assignments/${assignment.id}/submissions/${submissionId}/status`
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

            $points = await getPoints($userUuid);
            isCompletedPromise = isCompleted();
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

{#await isCompletedPromise}
  <p>Loading...</p>
{:then isCompleted}
  {#if isCompleted}
    <span>You have completed this assignment</span>
    <i
      class="fa-solid fa-check text-green-400 fa-xl"
      width="50px"
      height="50px"
    />
  {:else}
    <p>You have not yet completed this assignment</p>
  {/if}
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

    {#if assignment.assignment_order < assignmentCount}
      <a
        class="bg-green-500 hover:bg-green-700 text-white font-bold p-4 rounded m-4"
        href={`/assignments/${$nextAssignmentId}`}
      >
        Next assignment
      </a>
    {:else}
      <p>
        That was the last assignment in the set. You can continue to choose
        assignments from the list.
      </p>
    {/if}
  {:else}
    <p>Incorrect</p>
    <p>{result.grader_feedback}</p>
  {/if}
{/if}
