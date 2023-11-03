<script>
  import { userUuid } from "../stores/stores.js";

  let code = "";
  let message = "";
  let result = "";

  const getAssignment = async () => {
    code = "";
    result = "";
    const data = {
      user: $userUuid,
    };

    const response = await fetch("/api/assignment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
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
      assignment: await assignmentPromise,
      code: code,
    };

    const response = await fetch("/api/submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const submission = await response.json();
    console.log(submission);

    if (submission.userHasPending) {
      message = "You have a currently pending submission. Please wait.";
      return;
    }
    pollingManager.start(submission.submissionId, 1); // Replace 'submission-id' with actual ID, and X with the interval in seconds
  };

  const pollingManager = (() => {
    let intervals = new Map(); // Store interval IDs against submission IDs

    const startPolling = (id, interval) => {
      // Clear any existing intervals for this ID to avoid duplicate polling
      if (intervals.has(id)) {
        clearInterval(intervals.get(id));
      }

      // Define the polling function
      const poll = async () => {
        try {
          message = "Waiting for grading...";
          const response = await fetch(`/api/submission/${id}/status`);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const submission = await response.json();
          console.log(submission);

          // Stop polling if the submission is processed
          if (submission.status === "processed") {
            clearInterval(intervals.get(id));
            intervals.delete(id);
            message = "";
            console.log(`Processing complete for submission ${id}!`);
            result = submission;
          }
        } catch (error) {
          console.error(`Failed to fetch submission status for ${id}:`, error);
          // Optionally clear the interval on error, or retry after a delay
        }
      };

      // Set up the interval and store the ID
      intervals.set(id, setInterval(poll, interval * 1000));
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
{:then assignment}
  <h3>{assignment.title}</h3>
  <p>{assignment.handout}</p>
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
    <button
      class="bg-green-500 hover:bg-green-700 text-white font-bold p-4 rounded m-4"
      on:click={getNextAssignment}
    >
      Next assignment
    </button>
  {:else}
    <p>Incorrect</p>
    <p>{result.grader_feedback}</p>
  {/if}
{/if}
