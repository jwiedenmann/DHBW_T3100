<script>
  window.onload = function () {
    const currentTheme = localStorage.getItem("theme") || "light";
    console.log(currentTheme);
    const toggleCheckbox = document.querySelector("[data-toggle-theme]");
    // @ts-ignore
    toggleCheckbox.checked = currentTheme !== "light";
  };
</script>

<div class="navbar bg-base-100">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost text-2xl font-extrabold">
      <img src="/assets/logo.svg" alt="Logo" class="w-10" />
      Graph Visualizer
    </a>
  </div>

  <div class="flex">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6"
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
    <input
      type="checkbox"
      class="toggle theme-controller mx-1"
      data-toggle-theme="synthwave"
      data-act-class="active"
    />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg
    >
  </div>
</div>

<style global lang="postcss">
</style>
