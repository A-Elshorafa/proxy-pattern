using InventoryProxy.Models;

namespace InventoryProxy.Inventory;

public static class SeedData
{
    public static List<(Warehouse Warehouse, Dictionary<string, int> Stock)> Warehouses() =>
    [
        (new("CAI-01", "Cairo Central Hub", "Cairo", 30.0444, 31.2357),
            new() { ["LAPTOP-15"] = 5, ["PHONE-X"] = 20, ["HEADSET-PRO"] = 10, ["MONITOR-27"] = 0, ["KEYBOARD-MX"] = 15 }),
        (new("MNS-01", "Mansoura Delta DC", "Mansoura", 31.0409, 31.3785),
            new() { ["LAPTOP-15"] = 2, ["PHONE-X"] = 10, ["HEADSET-PRO"] = 4, ["MONITOR-27"] = 5, ["KEYBOARD-MX"] = 10 }),
        (new("ALX-01", "Alexandria Port DC", "Alexandria", 31.2001, 29.9187),
            new() { ["LAPTOP-15"] = 12, ["PHONE-X"] = 3, ["MONITOR-27"] = 8, ["KEYBOARD-MX"] = 4, ["CHAIR-ERGO"] = 6 }),
        (new("ASW-01", "Aswan South DC", "Aswan", 24.0889, 32.8998),
            new() { ["LAPTOP-15"] = 30, ["PHONE-X"] = 30, ["HEADSET-PRO"] = 30, ["MONITOR-27"] = 30, ["KEYBOARD-MX"] = 30, ["CHAIR-ERGO"] = 30 }),
    ];
}
