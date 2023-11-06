<script>
    export let assignment;
    export let assignmentCount;
</script>

<h2 class="text-2xl font-bold">
    Assignment {assignment.assignment_order}/{assignmentCount}
</h2>

<h3 id="title" class="text-xl mt-2">{assignment.title}</h3>
<p id="handout" class="mt-2">{assignment.handout}</p>
