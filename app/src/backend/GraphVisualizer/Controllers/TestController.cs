//using Microsoft.AspNetCore.Mvc;
//using VDS.RDF.Parsing;
//using VDS.RDF;
//using VDS.RDF.Query;
//using Newtonsoft.Json;

//namespace GraphVisualizer.Controllers;

//[ApiController]
//[Route("[controller]")]
//public class TestController : Controller
//{
//    private readonly Loader _loader = new(new HttpClient());
//    private readonly HashSet<string> _visitedUris = [];

//    [HttpGet]
//    public async Task<IActionResult> Index()
//    {
//        // string startingUri = "http://dbpedia.org/resource/Albert_Einstein";
//        string startingUri = "https://dbpedia.org/ontology/deathPlace";
//        Graph g = new();

//        await _loader.LoadGraphAsync(g, new Uri(startingUri));
//        return await Task.FromResult(Ok(ConvertGraphToJsonLd(g)));
//    }

//    public string ConvertGraphToJsonLd(IGraph graph)
//    {
//        var nodes = new List<object>();
//        foreach (Triple triple in graph.Triples.Distinct())
//        {
//            var node = new
//            {
//                Subject = triple.Subject.ToString(),
//                Predicate = triple.Predicate.ToString(),
//                Object = triple.Object.ToString()
//            };
//            nodes.Add(node);
//        }

//        string json = JsonConvert.SerializeObject(nodes, Formatting.Indented);
//        return json;
//    }

//    private async Task NewMethod1()
//    {
//        string startingUri = "http://dbpedia.org/resource/Albert_Einstein";
//        int maxDepth = 1;

//        Graph masterGraph = new();
//        await FetchGraphRecursively(startingUri, masterGraph, 0, maxDepth);

//        Console.WriteLine($"Master graph has {masterGraph.Triples.Count} triples from different subgraphs.");
//    }

//    private async Task FetchGraphRecursively(string uri, IGraph masterGraph, int currentDepth, int maxDepth)
//    {
//        if (currentDepth > maxDepth || _visitedUris.Contains(uri)) return;

//        _visitedUris.Add(uri);
//        Graph g = new();

//        try
//        {
//            await _loader.LoadGraphAsync(g, new Uri(uri));
//            Console.WriteLine($"Loaded {g.Triples.Count} triples from {uri}");

//            // Merge current graph into the master graph
//            masterGraph.Merge(g);

//            // Recursively load other URIs found in this graph
//            foreach (Triple triple in g.Triples)
//            {
//                if (triple.Object is UriNode objectUriNode && !_visitedUris.Contains(objectUriNode.Uri.ToString()))
//                {
//                    await FetchGraphRecursively(objectUriNode.Uri.ToString(), masterGraph, currentDepth + 1, maxDepth);
//                }
//            }
//        }
//        catch (Exception ex)
//        {
//            Console.WriteLine($"Error loading RDF data from {uri}: {ex.Message}");
//        }
//    }

//    private async Task<IActionResult> NewMethod()
//    {
//        try
//        {
//            //Define a remote endpoint
//            //Use the DBPedia SPARQL endpoint with the default Graph set to DBPedia
//            // SparqlRemoteEndpoint endpoint = new SparqlRemoteEndpoint(new Uri("http://dbpedia.org/sparql"), "http://dbpedia.org");
//            SparqlQueryClient sparqlQueryClient = new SparqlQueryClient(new HttpClient(), new Uri("http://dbpedia.org/sparql"));

//            //Make a SELECT query against the Endpoint
//            const string query = @"
//PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

//SELECT DISTINCT  ?resource ?label WHERE {
//  ?resource rdfs:label ?label .
//  FILTER(regex(?label, ""^Berlin$"", ""i"") && langMatches(lang(?label), ""EN""))
//}
//LIMIT 100";

//            SparqlResultSet results = await sparqlQueryClient.QueryWithResultSetAsync(query);
//            foreach (SparqlResult result in results)
//            {
//                // Extract variables from the result
//                INode subject = result["resource"];
//                INode label = result["label"];

//                // Print out the results
//                Console.WriteLine($"Subject: {subject.ToString()}, Label: {label.ToString()}");

//                IGraph g = new Graph();
//                await new Loader(new HttpClient()).LoadGraphAsync(g, new Uri(subject.ToString()));
//            }


//            return Ok();
//        }
//        catch (Exception ex)
//        {

//            throw;
//        }
//    }
//}