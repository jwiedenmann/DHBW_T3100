using GraphVisualizer.Data;
using Newtonsoft.Json;
using VDS.RDF;

namespace GraphVisualizer.Utils;

public static class GraphHelper
{
    public static string ConvertGraphToJsonLd(IGraph graph)
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

    public static KnowledgeGraph ConvertGraphToKnowledgeGraph(Graph graph)
    {
        KnowledgeGraph knowledgeGraph = new();
        Dictionary<string, Node> nodeDictionary = [];

        foreach (Triple triple in graph.Triples.Distinct())
        {
            string subject = triple.Subject.ToString();
            string predicate = triple.Predicate.ToString();
            string obj = triple.Object.ToString();


            if (!nodeDictionary.TryGetValue(subject, out Node? subjectNode))
            {
                subjectNode = new Node { Uri = subject };
                nodeDictionary.Add(subject, subjectNode);
            }

            if (predicate == "http://www.w3.org/2000/01/rdf-schema#label" && obj.EndsWith("@en")) // Assuming "label" is the predicate for label
            {
                subjectNode.Label = obj[..^3];
                continue;
            }
            // TODO add filter for predicates
            //else
            //{
            //    value.Properties[predicate] = obj;
            //}

            // add links to the linked nodes
            subjectNode.Links.TryAdd(predicate, obj);

            // add the linked node to the node dictionary
            nodeDictionary.TryAdd(obj, new Node { Uri = obj });
        }

        knowledgeGraph.Nodes = nodeDictionary.Values.ToList();

        return knowledgeGraph;
    }
}
