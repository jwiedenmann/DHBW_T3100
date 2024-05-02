<script>
// @ts-nocheck

  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import SunIco from "../utils/icons/Sun.svelte";
  import MoonIco from "../utils/icons/Moon.svelte";

  onMount(() => {
    themeChange(false);
  });

  window.onload = function () {
    const currentTheme = localStorage.getItem("theme") || "light";
    const toggleCheckboxes = document.querySelectorAll("[data-toggle-theme]");
    toggleCheckboxes.forEach((checkbox) => {
      // @ts-ignore
      checkbox.checked = currentTheme !== "light";
    });
  };

  function setThemeCheckBox(isChecked) {
    console.log(isChecked);
    const toggleCheckboxes = document.querySelectorAll("[data-toggle-theme]");
    toggleCheckboxes.forEach((checkbox) => {
      // @ts-ignore
      checkbox.checked = isChecked;
    });
  }
</script>

<div
  class="navbar bg-base-100 sticky top-0 z-50 backdrop-filter backdrop-blur-sm bg-opacity-90 transition-shadow shadow-sm"
>
  <div class="flex-1">
    <a href="/" class="btn btn-ghost text-2xl font-extrabold">
      <img src="/assets/logo.svg" alt="Logo" class="w-10" />
      Graph Visualizer
    </a>
  </div>

  <div class="hidden md:flex">
    <div class="w-7 fill-current">
      <SunIco />
    </div>
    <input
      type="checkbox"
      on:click={event => setThemeCheckBox(event.target.checked)}
      class="toggle theme-controller mx-1"
      data-toggle-theme="synthwave"
      data-act-class="active"
    />
    <div class="w-6 fill-current">
      <MoonIco />
    </div>
  </div>
  <div class="md:hidden">
    <label class="swap swap-rotate">
      <!-- this hidden checkbox controls the state -->
      <input
        type="checkbox"
        on:click={event => setThemeCheckBox(event.target.checked)}
        class="theme-controller"
        data-toggle-theme="synthwave"
        data-act-class="active"
      />

      <!-- sun icon -->
      <div class="swap-off w-7 fill-current">
        <SunIco />
      </div>

      <!-- moon icon -->
      <div class="swap-on w-6 fill-current flex">
        <MoonIco />
      </div>
    </label>
  </div>
</div>

<style global lang="postcss">
</style>
