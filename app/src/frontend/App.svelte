<script>
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import Router, { location, link } from "svelte-spa-router";
  import "@fortawesome/fontawesome-free/css/all.min.css";

  onMount(() => {
    themeChange(false);
  });

  import Home from "./lib/pages/Home.svelte";
  import Search from "./lib/pages/Search.svelte";
  import Graph from "./lib/pages/Graph.svelte";
</script>

<main>
  <!-- <a  href="/">Home</a>
	<a href="/#/search">Search</a>
	<a href="/#/graph">Graph</a> -->

  <Router
    routes={{
      "/": Home,
      "/search": Search,
      "/graph": Graph,
    }}
  />
</main>

<style global lang="postcss">
</style>
