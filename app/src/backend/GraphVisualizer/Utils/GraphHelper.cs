using GraphVisualizer.Data;
using Newtonsoft.Json;
using System.Text.RegularExpressions;
using VDS.RDF;

namespace GraphVisualizer.Utils;

public static class GraphHelper
{
    private static readonly Regex _isTextRegex = new("@([a-zA-Z]{2})$", RegexOptions.Compiled);

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

    public static KnowledgeGraph ConvertGraphToKnowledgeGraph(Graph graph, int limit)
    {
        KnowledgeGraph knowledgeGraph = new();
        Dictionary<string, Node> nodeDictionary = [];

        foreach (Triple triple in graph.Triples.Distinct())
        {
            string subject = triple.Subject.ToString();
            string predicate = triple.Predicate.ToString();
            string obj = triple.Object.ToString();

            if (!nodeDictionary.TryGetValue(subject, out Node? subjectNode) && nodeDictionary.Count < limit)
            {
                subjectNode = new Node { Uri = subject };
                nodeDictionary.Add(subject, subjectNode);
            }
            else if (subjectNode is null)
            {
                continue;
            }

            if (_isTextRegex.IsMatch(obj))
            {
                if (obj.EndsWith("@en"))
                {
                    if (predicate == "http://www.w3.org/2000/01/rdf-schema#label")
                    {
                        subjectNode.Label = obj[..^3];
                    }
                    else
                    {
                        subjectNode.Properties.TryAdd(predicate, obj);
                    }

                    continue;
                }

                // skip non english texts
                continue;
            }

            if (nodeDictionary.Count >= limit)
            {
                continue;
            }

            // check if predicate already exists
            if (!subjectNode.Links.TryGetValue(predicate, out List<string>? links))
            {
                links = [];
                subjectNode.Links.Add(predicate, links);
            }

            // add link to node
            links.Add(obj);

            // add the linked node to the node dictionary
            nodeDictionary.TryAdd(obj, new Node { Uri = obj });
        }

        knowledgeGraph.Nodes = nodeDictionary.Values.ToList();

        return knowledgeGraph;
    }
}
