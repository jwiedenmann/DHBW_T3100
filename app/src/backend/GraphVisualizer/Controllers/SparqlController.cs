using GraphVisualizer.DataAccess;
using Microsoft.AspNetCore.Mvc;
using VDS.RDF.Query;

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
        //var v = await _sparqlRepository.Search(searchTerm);

        return Ok(searchTerm);
    }
}
