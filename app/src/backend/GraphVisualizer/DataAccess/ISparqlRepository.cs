using GraphVisualizer.Data;
using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public interface ISparqlRepository
{
    Task<KnowledgeGraph> Get(string uri, int loadingDepth, int limit);

    Task<SparqlResultSet> Search(string searchTerm);
}