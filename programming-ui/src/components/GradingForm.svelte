<script>
  import { onMount } from "svelte";
  import { userUuid } from "../stores/stores.js";
  import { points } from "../stores/pointStore.js";
  import { getPoints } from "../utils/getPoints.js";
  import { nextAssignmentId } from "../stores/assignmentStore.js";

  export let assignment;
  export let assignmentCount;

  let code = "";
  let warningText = "";
  let result = "";

  const States = {
    IS_IDLE: "IS_IDLE",
    IS_SUBMITTING: "IS_SUBMITTING",
    IS_GRADING: "IS_GRADING",
  };

  let state = States.IS_IDLE;

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
    return await response.json();
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
    state = States.IS_SUBMITTING;
    warningText = "";
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
      warningText = "You already have a pending submission";
      state = States.IS_IDLE;
      return;
    }
    // Short poll submission status every 2 seconds
    pollingManager.start(submission.submissionId, 2);
  };

  const pollingManager = (() => {
    let intervals = new Map();

    const startPolling = (submissionId, interval) => {
      if (intervals.has(submissionId)) {
        clearInterval(intervals.get(submissionId));
      }

      const poll = async () => {
        try {
          state = States.IS_GRADING;
          const response = await fetch(
            `/api/assignments/${assignment.id}/submissions/${submissionId}/status`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const submission = await response.json();

          // Stop polling if the submission is processed
          if (submission.status === "processed") {
            clearInterval(intervals.get(submissionId));
            intervals.delete(submissionId);

            $points = await getPoints($userUuid);
            isCompletedPromise = isCompleted();
            state = States.IS_IDLE;
            result = submission;
          }
        } catch (error) {
          console.error(error);
        }
      };

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
  <i class="fa-solid fa-spinner fa-spin fa-xl" />
{:then isCompleted}
  {#if isCompleted}
    <span>(You have completed this assignment)</span>
    <i
      class="fa-solid fa-check text-green-400 fa-xl"
      width="50px"
      height="50px"
    />
  {/if}
{/await}

<textarea
  id="code"
  bind:value={code}
  rows="4"
  cols="50"
  class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300"
/>
<button
  id="submitBtn"
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded m-4"
  on:click={submit}
>
  Submit code
</button>
{#if state === States.IS_SUBMITTING}
  <span>Submitting code</span>
  <i class="fa-solid fa-spinner fa-spin fa-xl m-2" />
{:else if state === States.IS_GRADING}
  <span>Waiting for grading</span>
  <i class="fa-solid fa-spinner fa-spin fa-xl m-2" />
{/if}

{#if warningText}
  <div
    id="warnings"
    class="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300"
  >
    <p id="warningText">{warningText}</p>
  </div>
{/if}

{#if result}
  <div id="result">
    {#if result.correct}
      <p
        id="resultText"
        class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400"
      >
        Correct!
      </p>

      {#if assignment.assignment_order < assignmentCount}
        <a
          id="nextAssignment"
          class="bg-green-600 hover:bg-green-700 text-white font-bold p-4 rounded m-4"
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
      <div
        class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
      >
        <p id="resultText">Incorrect</p>
        <p id="graderFeedback">{result.grader_feedback}</p>
      </div>
    {/if}
  </div>
{/if}
