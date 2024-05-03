using VDS.RDF.Query;

namespace GraphVisualizer.DataAccess;

public interface ISparqlRepository
{
    void Get(string resource);
    Task<SparqlResultSet> Search(string searchTerm);
}