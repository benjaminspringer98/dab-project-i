<script>
    export let assignments;
    import { userUuid } from "../stores/stores.js";
</script>

<ul class="">
    <p class="m-1 font-bold">Assignments</p>
    {#each assignments as assignment}
        <a class="" href={`/assignments/${assignment.id}`}>
            <li class="p-1 hover:bg-blue-500 hover:text-white rounded">
                {assignment.assignment_order}
                {assignment.title}
            </li>
        </a>
    {/each}
</ul>
