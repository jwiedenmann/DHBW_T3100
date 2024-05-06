<script>
  // @ts-nocheck
  export let showSearchBar = false;
  export let searchQuery = "";

  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import { push } from "svelte-spa-router";
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
    const toggleCheckboxes = document.querySelectorAll("[data-toggle-theme]");
    toggleCheckboxes.forEach((checkbox) => {
      // @ts-ignore
      checkbox.checked = isChecked;
    });
  }

  function handleSubmit(event) {
    event.preventDefault(); // Stop the form from submitting normally
    const searchQuery = event.target.search.value;
    push(`#/search?query=${encodeURIComponent(searchQuery)}`);
  }
</script>

<div
  class="navbar bg-base-100 sticky top-0 z-50 backdrop-filter backdrop-blur-sm bg-opacity-90 transition-shadow shadow-sm"
>
  <div class="flex">
    <a href="/" class="btn btn-ghost text-2xl font-extrabold">
      <img src="/assets/logo.svg" alt="Logo" class="w-10" />
      Graph Visualizer
    </a>
  </div>

  {#if showSearchBar}
    <form class="flex justify-center flex-nowrap lg:ml-4" on:submit={handleSubmit}>
      <label
        class="input input-bordered rounded-full flex items-center gap-2 pr-0"
      >
        <input type="text" name="search" bind:value={searchQuery} class="grow" placeholder="I want to know about..." />
        <button
          class="inline-flex flex-shrink-0 h-12 justify-center items-center px-4 rounded-full"
        >
          <i class="fa-solid fa-magnifying-glass opacity-50"></i>
        </button>
      </label>
    </form>
  {/if}

  <div class="flex-1" />

  <div class="hidden md:flex">
    <div class="w-7 fill-current">
      <SunIco />
    </div>
    <input
      type="checkbox"
      on:click={(event) => setThemeCheckBox(event.target.checked)}
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
        on:click={(event) => setThemeCheckBox(event.target.checked)}
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
