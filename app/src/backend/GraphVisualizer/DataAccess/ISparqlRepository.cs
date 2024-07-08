using GraphVisualizer.Data;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public interface ISparqlRepository
{
    Task<KnowledgeGraph> Get(string uri);
    Task<SparqlResultSet> Search(string searchTerm);
}