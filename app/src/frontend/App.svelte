<script>
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import Navbar from "./lib/components/Navbar.svelte";

  onMount(() => {
    themeChange(false);
  });
</script>

<main>
  <Navbar />
  <h1 class="mb-4 text-4xl font-extrabold leading-none">This is a heading!</h1>
</main>

<style global lang="postcss">
  main {
    height: 100rem;
    background-color: lightgray;
  }
</style>
