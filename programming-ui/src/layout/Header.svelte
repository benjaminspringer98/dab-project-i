<script>
  import { userUuid } from "../stores/stores.js";
  import { points } from "../stores/pointStore.js";
</script>

<nav class="p-4 mb-4 shadow">
  <span class="text-2xl text-gray-700 font-serif">Hello {$userUuid}!</span>
  <span>Points: {$points}</span>
</nav>
