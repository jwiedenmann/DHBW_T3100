namespace GraphVisualizer.Data;

public class Node
{
    public string Uri { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public Dictionary<string, string> Properties { get; set; } = [];
    public Dictionary<string, string> Links { get; set; } = [];
}
