<script>
    import { onMount } from "svelte";
    import { userUuid } from "../stores/stores.js";
    import { points } from "../stores/pointStore.js";
    import { getPoints } from "../utils/getPoints.js";

    onMount(async () => {
        $points = await getPoints($userUuid);
    });

    const fetchNextUncompletedAssignment = async () => {
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
        return await response.json();
    };

    let nextUncompletedAssignmentPromise = fetchNextUncompletedAssignment();
</script>

{#await nextUncompletedAssignmentPromise}
    <p>Loading...</p>
{:then nextUncompletedAssignment}
    {#if !nextUncompletedAssignment}
        <p>You have completed all assignments. Congratz!</p>
    {:else}
        <p>
            Click on the button below to continue with the last one you haven't
            completed:
        </p>
        <a
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded m-4"
            href={`/assignments/${nextUncompletedAssignment.id}`}
            >Go to assignment</a
        >
    {/if}
{/await}
