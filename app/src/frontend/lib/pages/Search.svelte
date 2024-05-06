<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";

  let searchQuery = null;
  let searchResults = [];

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

  function loadResults() {
    fetchResults().then(
      function (value) {
        searchResults = value;
      },
      function (error) {
        console.log(error);
      }
    );
  }

  async function fetchResults() {
    const url = new URL(
      import.meta.env.VITE_ROUTE_Sparql_Search,
      import.meta.env.VITE_BASE_URL
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
    {#each searchResults as searchResult}
      <div class="ml-6 mt-4 xl:ml-18">
        <a href="/#/graph/?uri={searchResult.Subject}" class="link link-info font-semibold text-xl"
          >{searchResult.Label}</a
        >
        <p>{searchResult.Subject}</p>
      </div>
    {/each}
  </main>

  <Footer />
</div>

<style global lang="postcss">
</style>
