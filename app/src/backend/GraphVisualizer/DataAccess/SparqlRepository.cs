using GraphVisualizer.Data;
using GraphVisualizer.Utils;
using Microsoft.Extensions.Caching.Memory;
using VDS.RDF;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public class SparqlRepository : ISparqlRepository
{
    public const string GraphCacheKey = "graphCacheKey";
    private readonly IConfiguration _configuration;
    private readonly PersistentMemoryCache _cache;
    private readonly HttpClient _httpClient;

    public SparqlRepository(IConfiguration configuration, PersistentMemoryCache persistentMemory, HttpClient httpClient)
    {
        _configuration = configuration;
        _cache = persistentMemory;
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(120);
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

    public async Task<KnowledgeGraph> Get(string uri, int loadingDepth, int limit)
    {
        if (!_cache.TryGetValue(GraphCacheKey, out Dictionary<string, KnowledgeGraph>? knowledgeGraphDictionary))
        {
            knowledgeGraphDictionary = [];
            _cache.Set(GraphCacheKey, knowledgeGraphDictionary);
        }

        if (!knowledgeGraphDictionary!.TryGetValue(uri, out KnowledgeGraph? knowledgeGraph))
        {
            Graph? graph = null;
            try
            {
                graph = (Graph?)await LoadGraphAsync(uri);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load graph for URI: {uri}. Exception: {ex.Message}");
            }

            if (graph == null)
            {
                return new KnowledgeGraph
                {
                    Nodes = new Dictionary<string, Node> { { uri, new Node { Uri = uri } } }
                };
            }

            knowledgeGraph = GraphHelper.ConvertGraphToKnowledgeGraph(graph);
            knowledgeGraphDictionary[uri] = knowledgeGraph;
            _cache.SaveCacheToDisk();
        }

        Console.WriteLine($"Initial load finished: {knowledgeGraph.Nodes.Count} nodes");

        // Limit the number of nodes returned
        KnowledgeGraph limitedKnowledgeGraph = ApplyNodeLimit(knowledgeGraph, limit);

        if (loadingDepth > 1)
        {
            await LoadSubGraphsAsync(limitedKnowledgeGraph, loadingDepth - 1, limit, knowledgeGraphDictionary);
        }

        Console.WriteLine($"Graph load finished: {knowledgeGraph.Nodes.Count} nodes");
        return limitedKnowledgeGraph;
    }

    private KnowledgeGraph ApplyNodeLimit(KnowledgeGraph fullGraph, int limit)
    {
        // Create a new dictionary to store the limited nodes
        Dictionary<string, Node> limitedNodes = fullGraph.Nodes
            .Take(limit)
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.DeepCopyNode());

        // Create a new KnowledgeGraph to return the limited set
        KnowledgeGraph limitedKnowledgeGraph = new()
        {
            Nodes = limitedNodes
        };

        // Ensure that only links from the limited nodes are included
        foreach (var node in limitedKnowledgeGraph.Nodes.Values)
        {
            // Filter links: keep only the predicates that link to nodes within the limited set
            Dictionary<string, List<string>> filteredLinks = [];

            foreach (var link in node.Links)
            {
                List<string> validTargets = link.Value
                    .Where(limitedKnowledgeGraph.Nodes.ContainsKey)
                    .ToList();

                if (validTargets.Count != 0)
                {
                    filteredLinks[link.Key] = validTargets;
                }
            }

            node.Links = filteredLinks;
        }

        return limitedKnowledgeGraph;
    }



    private async Task LoadSubGraphsAsync(KnowledgeGraph knowledgeGraph, int remainingDepth, int limit, Dictionary<string, KnowledgeGraph> knowledgeGraphDictionary)
    {
        var nodeUris = knowledgeGraph.Nodes.Keys.ToList();

        var tasks = nodeUris.Select(async uri =>
        {
            try
            {
                var subGraph = await Get(uri, remainingDepth, limit);
                Console.WriteLine($"Subgraph finished: {subGraph.Nodes.Count} nodes");

                lock (knowledgeGraph.Nodes)
                {
                    foreach (var subNode in subGraph.Nodes.Values)
                    {
                        if (knowledgeGraph.Nodes.TryGetValue(subNode.Uri, out var existingNode))
                        {
                            GraphHelper.MergeNodes(existingNode, subNode);
                        }
                        else
                        {
                            knowledgeGraph.Nodes[subNode.Uri] = subNode;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load subgraph for URI: {uri}. Exception: {ex.Message}");
            }
        });

        await Task.WhenAll(tasks);
    }


    private Task<IGraph> LoadGraphAsync(string uri)
    {
        try
        {
            Uri endpointUri = new(_configuration.GetValue<string>("Sparql:BaseUrl") ?? string.Empty);
            SparqlQueryClient sparqlQueryClient = new(_httpClient, endpointUri);

            string query = $@"
                CONSTRUCT {{
                    ?s ?p ?o .
                }}
                WHERE {{
                    ?s ?p ?o .
                    FILTER(?s = <{uri}>)
                }}";

            // Create a CancellationTokenSource
            CancellationTokenSource tokenSource = new(2000);
            return sparqlQueryClient.QueryWithResultGraphAsync(query, tokenSource.Token);
        }
        catch
        {
            return Task.FromResult((IGraph)new Graph());
        }
    }
}
