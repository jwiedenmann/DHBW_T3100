<script>
  // import * as d3 from "d3";

  // export let data;
  // export let width = 640;
  // export let height = 400;
  // export let marginTop = 20;
  // export let marginRight = 20;
  // export let marginBottom = 20;
  // export let marginLeft = 20;

  // $: x = d3.scaleLinear(
  //   [0, data.length - 1],
  //   [marginLeft, width - marginRight]
  // );
  // $: y = d3.scaleLinear(d3.extent(data), [height - marginBottom, marginTop]);
  // $: line = d3.line((d, i) => x(i), y);

  export let name;
</script>

<main>
  <h1>Hello {name}!</h1>
  <h1 class="text-lg">
    Hello world!
  </h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
    how to build Svelte apps.
  </p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  /* h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  } */

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
