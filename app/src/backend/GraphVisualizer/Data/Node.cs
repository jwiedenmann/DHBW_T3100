namespace GraphVisualizer.Data;

public class Node
{
    public string Uri { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public Dictionary<string, string> Properties { get; set; } = [];
    public Dictionary<string, List<string>> Links { get; set; } = [];

    public Node DeepCopyNode()
    {
        return new Node
        {
            Uri = Uri,
            Label = Label,
            Properties = new Dictionary<string, string>(Properties),
            Links = Links.ToDictionary(entry => entry.Key, entry => new List<string>(entry.Value))
        };
    }
}
