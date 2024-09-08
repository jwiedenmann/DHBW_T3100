<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import { writable } from "svelte/store";

  let searchQuery = null;
  let searchResults = [];
  let loading = writable(true);

  $: if (searchQuery !== null) {
    loadResults();
  }

  function updateSearchQuery() {
    const params = getURLSearchParams();
    if (params.has("query")) {
      searchQuery = params.get("query");
    }
  }

  onMount(() => {
    window.addEventListener("popstate", updateSearchQuery);
    window.addEventListener("hashchange", updateSearchQuery);

    updateSearchQuery();
  });

  onDestroy(() => {
    window.removeEventListener("popstate", updateSearchQuery);
    window.removeEventListener("hashchange", updateSearchQuery);
  });

  async function loadResults() {
    loading.set(true);
    try {
      searchResults = await fetchResults();
    } catch (error) {
      console.log(error);
    } finally {
      loading.set(false);
    }
  }

  async function fetchResults() {
    const url = new URL(
      import.meta.env.VITE_ROUTE_Sparql_Search,
      // couldnt get the env variables to work...
      import.meta.env.MODE === "production"
        ? "http://localhost:8080"
        : import.meta.env.VITE_BASE_URL
    );
    url.searchParams.append("searchTerm", searchQuery);
    const response = await fetch(url);

    if (response.ok) {
      return response.json();
    }

    return [];
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={true} {searchQuery} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    {#if $loading}
      <!-- Show spinner while loading -->
      <div class="flex justify-center items-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
    {:else}
      {#each searchResults as searchResult}
        <div class="ml-6 mt-4 xl:ml-18">
          <a
            href="/#/graph/?uri={searchResult.Subject}"
            class="link link-info font-semibold text-xl">{searchResult.Label}</a
          >
          <p>{searchResult.Subject}</p>
        </div>
      {/each}
    {/if}
  </main>

  <Footer />
</div>

<style global lang="postcss">
</style>
