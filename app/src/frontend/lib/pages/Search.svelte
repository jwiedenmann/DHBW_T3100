<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";
  import { httpGet } from "../utils/HttpHelper";

  let searchQuery = null;

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
        console.log("value");
        console.log(value);
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
    return httpGet(url);
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={true} {searchQuery} />

  <main class="flex-1 flex flex-col overflow-y-auto"></main>

  <Footer />
</div>

<style global lang="postcss">
</style>
