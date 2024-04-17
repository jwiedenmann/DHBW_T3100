using Microsoft.AspNetCore.Mvc;

namespace GraphVisualizer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TestController : Controller
    {
        public IActionResult Index()
        {
            return Ok();
        }
    }
}
