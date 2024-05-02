<script>
  import Navbar from "../components/Navbar.svelte";
  import Footer from "../components/Footer.svelte";
</script>

<div class="h-screen flex flex-col overflow-hidden">
  <Navbar />

  <main class="flex-1 flex flex-col overflow-y-auto">
    <div
      class="flex-grow flex items-center justify-center mb-20 md:mb-36 lg:mb-52"
    >
      <div>
        <h1
          class="mb-4 text-center text-base-content font-extrabold tracking-tight text-5xl md:text-5xl lg:text-7xl"
        >
          Search the world!
        </h1>
        <div class="flex justify-center flex-nowrap">
          <label
            class="input input-bordered input-md input-primary flex items-center gap-10 rounded-md pr-0 md:w-10/12"
          >
            <input
              type="text"
              class="grow"
              placeholder="I want to know about..."
            />
            <a
              href="/"
              class="btn btn-primary px-5 py-3 text-base font-medium text-center rounded-none rounded-r-md"
            >
              <i class="fa-solid fa-magnifying-glass"></i>
            </a>
          </label>
        </div>
      </div>
    </div>
  </main>

  <Footer />
</div>

<style global lang="postcss">
</style>
