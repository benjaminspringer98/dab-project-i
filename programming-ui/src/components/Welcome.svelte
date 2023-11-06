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
    <i class="fa-solid fa-spinner fa-spin fa-2xl" />
{:then nextUncompletedAssignment}
    <div class="mt-6">
        {#if !nextUncompletedAssignment}
            <p>
                You have completed all assignments, congratz! You can continue
                to do previously solved assignments by choosing them from the
                list.
            </p>
        {:else}
            <p>
                Click below to continue with the last one you haven't completed:
            </p>
            <div class="m-4">
                <a
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-4 rounded m-4"
                    href={`/assignments/${nextUncompletedAssignment.id}`}
                    >Go to assignment</a
                >
            </div>
        {/if}
    </div>
{/await}
