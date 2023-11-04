<script>
    export let assignments;
</script>

<ul>
    {#each assignments as assignment}
        <li>
            {assignment.assignment_order}
            <a href={`/assignments/${assignment.id}`}>{assignment.title} </a>
        </li>
    {/each}
</ul>
