namespace InventoryProxy.Models;

public record OrderResult(Guid? ReservationId, Candidate? ReservedAt, List<string> Skipped, List<Candidate> Candidates, double ElapsedMs);
