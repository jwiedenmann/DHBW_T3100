using GraphVisualizer.DataAccess;
using Microsoft.AspNetCore.Mvc;
using VDS.RDF.Query;
using VDS.RDF;
using Newtonsoft.Json;

namespace GraphVisualizer.Controllers;

[ApiController]
[Route("v1/[controller]")]
public class SparqlController : Controller
{
    private readonly ISparqlRepository _sparqlRepository;

    public SparqlController(ISparqlRepository sparqlRepository)
    {
        _sparqlRepository = sparqlRepository;
    }

    [HttpGet("Search")]
    public async Task<IActionResult> Search([FromQuery] string searchTerm)
    {
        SparqlResultSet results = await _sparqlRepository.Search(searchTerm);
        List<object> resources = [];

        foreach (SparqlResult result in results.Cast<SparqlResult>())
        {
            string label = result["label"].ToString();
            resources.Add(new
            {
                Subject = result["resource"].ToString(),
                Label = label[..^3]  // Removes the last three characters (i.e. the @en)
            });
        }

        return Ok(JsonConvert.SerializeObject(resources, Formatting.Indented));
    }

    [HttpGet("Graph")]
    public async Task<IActionResult> Graph([FromQuery] string uri)
    {
        Graph graph = await _sparqlRepository.Get(uri);
        return await Task.FromResult(Ok(ConvertGraphToJsonLd(graph)));
    }

    public string ConvertGraphToJsonLd(IGraph graph)
    {
        var nodes = new List<object>();
        foreach (Triple triple in graph.Triples.Distinct())
        {
            var node = new
            {
                Subject = triple.Subject.ToString(),
                Predicate = triple.Predicate.ToString(),
                Object = triple.Object.ToString()
            };
            nodes.Add(node);
        }

        string json = JsonConvert.SerializeObject(nodes, Formatting.Indented);
        return json;
    }
}
