namespace InventoryProxy.Models;

public record SearchResult(Candidate? Selected, List<Candidate> Candidates, double ElapsedMs);
