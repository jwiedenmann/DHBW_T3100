<script>
  const themes = [
    "default",
    "light",
    "dark",
    "bumblebee",
    "emerald",
    "corporate",
    "retro",
    "cyberpunk",
  ];
</script>

<div class="navbar bg-base-100">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost text-2xl font-extrabold">
      <img src="/assets/logo.svg" alt="Logo" class="w-10" />
      Graph Visualizer
    </a>
  </div>

  <div class="m-5">
    <h2 class="mb-4 text-2xl text-green-700 font-bold">Toggle</h2>
    🌞
    <div class="inline-block w-10">
      <span data-toggle-theme="synthwave" data-act-class="pl-4" class="border rounded-full border-green-700 flex items-center cursor-pointer w-10 transition-all duration-300 ease-in-out pl-0">
        <span class="rounded-full w-3 h-3 m-1 bg-green-700">
        </span>
      </span>
    </div>
    🌚
  </div>

  <!-- <label class="flex cursor-pointer gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><circle cx="12" cy="12" r="5" /><path
        d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      /></svg
    >
    <input type="checkbox" value="synthwave" class="toggle theme-controller" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg
    >
  </label> -->
</div>

<style global lang="postcss">
</style>
