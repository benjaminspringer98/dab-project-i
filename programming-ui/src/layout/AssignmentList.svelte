<script>
    import { onMount } from "svelte";
    import {
        assignments,
        assignmentsCount,
    } from "../stores/assignmentStore.js";

    onMount(async () => {
        const res = await fetch("/api/assignments");
        $assignments = await res.json();
        $assignmentCount = $assignments.length;
    });
</script>

<ul class="">
    <p class="m-1 font-bold">Assignments</p>
    <a href="/assignments/1">Assignments</a>
    {#each $assignments as assignment}
        <a href={`/assignments/${assignment.id}`}>
            <li class="p-1 hover:bg-blue-500 hover:text-white rounded">
                {assignment.assignment_order}
                {assignment.title}
            </li>
        </a>
    {/each}
</ul>
