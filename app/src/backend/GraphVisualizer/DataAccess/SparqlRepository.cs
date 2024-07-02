using Microsoft.Extensions.Caching.Memory;
using VDS.RDF;
using VDS.RDF.Parsing;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public class SparqlRepository : ISparqlRepository
{
    private const string _graphCacheKey = "graphCacheKey";
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _memoryCache;
    private readonly HttpClient _httpClient;
    private readonly Loader _loader;

    public SparqlRepository(IConfiguration configuration, IMemoryCache memoryCache, HttpClient httpClient)
    {
        _configuration = configuration;
        _memoryCache = memoryCache;
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(120);
        _loader = new Loader(_httpClient);
    }

    public Task<SparqlResultSet> Search(string searchTerm)
    {
        try
        {
            Uri endpointUri = new(_configuration.GetValue<string>("Sparql:BaseUrl") ?? string.Empty);
            SparqlQueryClient sparqlQueryClient = new(_httpClient, endpointUri);

            string query = $@"
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?resource ?label WHERE {{
  ?resource rdfs:label ?label .
  FILTER(regex(?label, ""{searchTerm}"", ""i"") && langMatches(lang(?label), ""EN""))
}}
LIMIT 100";

            return sparqlQueryClient.QueryWithResultSetAsync(query);
        }
        catch
        {
            return Task.FromResult(new SparqlResultSet());
        }
    }

    public async Task<Graph> Get(string uri)
    {
        if (!_memoryCache.TryGetValue(_graphCacheKey, out Dictionary<string, Graph>? graphDictionary))
        {
            graphDictionary = [];
            _memoryCache.Set(_graphCacheKey, graphDictionary);
        }

        if (graphDictionary!.TryGetValue(uri, out Graph? graph))
        {
            return graph;
        }

        graph = new();
        await _loader.LoadGraphAsync(graph, new Uri(uri));
        graphDictionary.Add(uri, graph);

        return graph;
    }
}
