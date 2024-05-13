using VDS.RDF;
using VDS.RDF.Parsing;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public class SparqlRepository : ISparqlRepository
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly Loader _loader;

    public SparqlRepository(IConfiguration configuration, HttpClient httpClient)
    {
        _configuration = configuration;
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
        Graph graph = new();
        await _loader.LoadGraphAsync(graph, new Uri(uri));
        return graph;
    }
}
