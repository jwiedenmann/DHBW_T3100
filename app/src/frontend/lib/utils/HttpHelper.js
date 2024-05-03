export async function httpGet(url) {
    const response = await fetch(url);
    if (response.ok) {
        return await response.text();
    } else {
        console.error("Failed to fetch data: ", response.status);
        return null
    }
}