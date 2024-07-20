using GraphVisualizer.DataAccess;
using Microsoft.AspNetCore.Mvc;
using VDS.RDF.Query;
using VDS.RDF;
using Newtonsoft.Json;
using GraphVisualizer.Utils;
using GraphVisualizer.Data;

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
    public async Task<IActionResult> Graph([FromQuery] string uri, [FromQuery] int loadingDepth = 1, [FromQuery] int limit = 100)
    {
        KnowledgeGraph graph = await _sparqlRepository.Get(uri, loadingDepth, limit);
        return Ok(JsonConvert.SerializeObject(new { Nodes = graph.Nodes.Values }, Formatting.Indented));
    }
}
