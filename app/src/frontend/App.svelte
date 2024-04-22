<script>
  // import svelteLogo from './assets/svelte.svg'
  // import viteLogo from './assets/vite.svg'
  import Counter from './lib/Counter.svelte'
  import Fetchtest from './fetchtest.svelte';

  import LinePlot from './D3Test.svelte';
  import * as d3 from 'd3';

  let data = d3.ticks(-2, 2, 200).map(Math.sin);

  function onMousemove(event) {
		const [x, y] = d3.pointer(event);
    data = data.slice(-200).concat(Math.atan2(x, y));
  }
</script>

<main>
  <!-- <div on:mousemove={onMousemove} role="alert">
    <LinePlot data={data} />
  </div> -->
  <Fetchtest/>

  <!-- <div>
    <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
      <img src={viteLogo} class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Vite + Svelte</h1>

  <button class="bg-green-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Button
  </button>

  <div class="card">
    <Counter />
  </div>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer">SvelteKit</a>, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more
  </p> -->
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
