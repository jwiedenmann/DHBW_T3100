<script>
  // @ts-nocheck

  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
  import { onMount, onDestroy } from "svelte";
  import { getURLSearchParams } from "../utils/UrlHelper";

  let uri = null;
  let graphResults = [];

  onMount(() => {
    const params = getURLSearchParams();
    if (params.has("uri")) {
      uri = params.get("uri");
      loadResults();
    }
  });

  function loadResults() {
    fetchResults().then(
      function (value) {
        graphResults = value;
      },
      function (error) {
        console.log(error);
      }
    );
  }

  async function fetchResults() {
    const url = new URL(
      import.meta.env.VITE_ROUTE_Sparql_Graph,
      import.meta.env.VITE_BASE_URL
    );
    url.searchParams.append("uri", uri);
    const response = await fetch(url);

    if (response.ok) {
      return response.json();
    }

    return [];
  }
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar showSearchBar={false} />

  <main class="flex-1 flex flex-col overflow-y-auto">
    {#each graphResults as graphResult}
      <div class="ml-6 mt-4 xl:ml-18">
        <h1
          class="font-semibold text-xl">{graphResult.Subject} {graphResult.Predicate} {graphResult.Object}</h1
        >
      </div>
    {/each}
  </main>

  <Footer />
</div>

<style global lang="postcss">
</style>
