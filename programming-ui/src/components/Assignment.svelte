<script>
    import { onMount } from "svelte";
    import { userUuid } from "../stores/stores.js";
    import { points } from "../stores/pointStore.js";
    import { getPoints } from "../utils/getPoints.js";
    import { assignment } from "../stores/assignmentStore.js";
    import AssignmentInfo from "./AssignmentInfo.svelte";

    let code = "";
    let warningText = "";
    let result = "";
    let shouldDisplayResult = false;

    const States = {
        IS_IDLE: "IS_IDLE",
        IS_SUBMITTING: "IS_SUBMITTING",
        IS_GRADING: "IS_GRADING",
    };

    let state = States.IS_IDLE;

    onMount(async () => {
        $points = await getPoints($userUuid);
        await fetchAssignmentData();
    });

    const fetchAssignmentData = async () => {
        shouldDisplayResult = false;
        code = "";

        const data = {
            user: $userUuid,
        };

        const response = await fetch("/api/assignments/nextUncompleted", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        $assignment = await response.json();
    };

    const submit = async () => {
        state = States.IS_SUBMITTING;
        warningText = "";
        result = "";
        const data = {
            user: $userUuid,
            code: code,
        };

        const response = await fetch(
            `/api/assignments/${$assignment.id}/submissions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        const submission = await response.json();

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
                        `/api/assignments/${$assignment.id}/submissions/${submissionId}/status`
                    );
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! Status: ${response.status}`
                        );
                    }
                    const submission = await response.json();

                    if (submission.status === "processed") {
                        clearInterval(intervals.get(submissionId));
                        intervals.delete(submissionId);

                        $points = await getPoints($userUuid);
                        state = States.IS_IDLE;
                        shouldDisplayResult = true;
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

    const handleKeyDown = (event) => {
        // prevent tab from moving focus out of textarea for code
        if (event.key === "Tab") {
            event.preventDefault();

            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            // Insert tab at cursor position
            textarea.value =
                textarea.value.substring(0, start) +
                "\t" +
                textarea.value.substring(end);

            // Update the cursor to be after the inserted tab
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
    };
</script>

{#if !$assignment}
    <p class="text-center text-lg m-10">
        Looks like you have solved all assignments. Congratz!
    </p>
{:else}
    <AssignmentInfo assignment={$assignment} />

    <textarea
        id="code"
        bind:value={code}
        rows="10"
        cols="50"
        class="form-textarea m-5 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 bg-gray-800 text-white font-mono text-sm leading-6"
        placeholder="Your code"
        on:keydown={handleKeyDown}
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
            class="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50"
        >
            <p id="warningText">{warningText}</p>
        </div>
    {/if}

    {#if result && shouldDisplayResult}
        <div id="result">
            {#if result.correct}
                <p
                    id="resultText"
                    class="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50"
                >
                    Correct!
                </p>
                <button
                    on:click={fetchAssignmentData}
                    id="nextAssignment"
                    class="bg-green-600 hover:bg-green-700 text-white font-bold p-4 m-4 rounded"
                    >Next assignment</button
                >
            {:else}
                <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
                    <p id="resultText">Incorrect</p>
                    <p id="graderFeedback">{result.grader_feedback}</p>
                </div>
            {/if}
        </div>
    {/if}
{/if}
