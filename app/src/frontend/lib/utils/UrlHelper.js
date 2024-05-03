export function getURLSearchParams(){
    const hash = window.location.hash;
    const [path, queryString] = hash.split('?');
    return new URLSearchParams(queryString);
}