<script>
  import { userUuid } from "../stores/stores.js";

  //   const doSimpleGradingDemo = async () => {
  //     const data = {
  //       user: $userUuid,
  //       code: `def hello():
  //   return "helo world!"
  // `,
  //     };

  //     code = "";

  //     const response = await fetch("/api/grade", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     const jsonData = await response.json();
  //     console.log(jsonData);
  //     alert(JSON.stringify(jsonData));
  //   };
  const getAssignment = async () => {
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

  let code = "";

  const submit = async () => {
    const data = {
      user: $userUuid,
      assignment: await assignmentPromise,
      code: code,
    };

    code = "";
    const response = await fetch("/api/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const jsonData = await response.json();
    alert(JSON.stringify(jsonData));
  };
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
