using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public class SparqlRepository : ISparqlRepository
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public SparqlRepository(IConfiguration configuration, HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public Task<SparqlResultSet> Search(string searchTerm)
    {
        try
        {
            Uri endpointUri = new(_configuration.GetValue<string>("Sparql:BaseUrl") ?? string.Empty);
            SparqlQueryClient sparqlQueryClient = new(_httpClient, endpointUri);

            string query = $@"
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?resource ?label WHERE {{
  ?resource rdfs:label ?label .
  FILTER(regex(?label, ""^{searchTerm}$"", ""i"") && langMatches(lang(?label), ""EN""))
}}
LIMIT 100";

            return sparqlQueryClient.QueryWithResultSetAsync(query);
        }
        catch
        {
            return Task.FromResult(new SparqlResultSet());
        }
    }

    public void Get(string resource)
    {

        throw new NotImplementedException();
    }
}
