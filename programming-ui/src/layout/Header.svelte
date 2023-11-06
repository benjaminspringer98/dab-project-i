<script>
  import { points } from "../stores/pointStore.js";
</script>

<nav class="p-4 mb-4 shadow">
  <a class="text-2xl font-serif ml-1" href="/"
    >Home <i class="fa-solid fa-house fa-sm" /></a
  >
  <span
    id="points"
    class="absolute right-0 mr-8 text-2xl text-gray-700 font-serif"
    >Current points: {$points}</span
  >
</nav>
