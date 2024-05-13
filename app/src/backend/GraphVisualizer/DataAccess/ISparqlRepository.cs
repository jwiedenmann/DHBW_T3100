using VDS.RDF;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public interface ISparqlRepository
{
    Task<Graph> Get(string uri);
    Task<SparqlResultSet> Search(string searchTerm);
}