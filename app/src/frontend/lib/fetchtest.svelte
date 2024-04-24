<script>
  let data = "";

  async function fetchData() {
    const response = await fetch("https://localhost:7088/Test"); // Change to your C# API URL
    console.log(response);
    if (response.ok) {
      data = await response.text();
    } else {
      console.error("Failed to fetch data: ", response.status);
    }
  }
</script>

<button on:click={fetchData}>Fetch Data</button>
<p>{data}</p>
