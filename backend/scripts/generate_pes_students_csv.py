"""Generate scripts/fixtures/pes_ring_road_students.csv (~150 students).

Neighborhood pockets around Bangalore, commuting to PES Ring Road campus.
Run from backend/:  python scripts/generate_pes_students_csv.py
"""

from __future__ import annotations

import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent / "fixtures" / "pes_ring_road_students.csv"

# (label, lat, lng) — pocket centers; 10 students jittered around each.
POCKETS: list[tuple[str, float, float]] = [
    ("Banaswadi", 13.0154, 77.6413),
    ("Ramamurthy Nagar", 13.0162, 77.6748),
    ("JP Nagar", 12.9063, 77.5855),
    ("Hoskote", 13.0709, 77.7982),
    ("Yelahanka", 13.1007, 77.5960),
    ("Jayanagar", 12.9304, 77.5835),
    ("Tumkur Road", 13.0395, 77.5210),
    ("Vijayanagar", 12.9634, 77.5372),
    ("Basavanagudi", 12.9416, 77.5735),
    ("Kengeri", 12.9074, 77.4858),
    ("Jnanabharathi", 12.9482, 77.5015),
    ("Bangalore University", 12.9538, 77.5132),
    ("RR Nagar", 12.9268, 77.5195),
    ("Banashankari", 12.9255, 77.5488),
    ("BTM Layout", 12.9166, 77.6101),
]

FIRST = [
    "Aisha", "Rohan", "Priya", "Arjun", "Sneha", "Neha", "Diya", "Karan",
    "Kabir", "Meera", "Dev", "Ananya", "Vikram", "Ishaan", "Riya", "Aditya",
    "Sara", "Harsh", "Nisha", "Rahul", "Zara", "Omar", "Leela", "Manish",
    "Isha", "Varun", "Pooja", "Siddharth", "Kavya", "Aman", "Tanvi", "Nikhil",
    "Shruti", "Yash", "Anika", "Rajat", "Myra", "Kiran", "Sana", "Vivek",
    "Aarav", "Kiara", "Reyansh", "Aadhya", "Vivaan", "Anvi", "Shaurya", "Ira",
    "Atharv", "Navya",
]
LAST = [
    "Khan", "Mehta", "Nair", "Rao", "Iyer", "Reddy", "Krishnan", "Malhotra",
    "Shah", "Joshi", "Patel", "Das", "Singh", "Gupta", "Menon", "Bose",
    "Ali", "Verma", "Pillai", "Desai", "Farooq", "Jain", "Chopra", "Bhat",
    "Shetty", "Kulkarni", "Hegde", "Nayak", "Prasad", "Mukherjee",
]


def main() -> None:
    per_pocket = 10  # 15 × 10 = 150
    rows: list[dict[str, str]] = []
    n = 0
    for _label, base_lat, base_lng in POCKETS:
        for j in range(per_pocket):
            n += 1
            # Tight ~40–80 m jitter so DBSCAN (eps 500 m) keeps one stop per pocket.
            dlat = ((j % 5) - 2) * 0.00012
            dlng = ((j // 5) - 1) * 0.00014 + (j % 3) * 0.00005
            first = FIRST[(n - 1) % len(FIRST)]
            last = LAST[(n * 3 + j) % len(LAST)]
            # Avoid duplicate full names within the file.
            name = f"{first} {last}"
            if any(r["name"] == name for r in rows):
                name = f"{first} {last} {n}"
            local = f"{first}.{last}{n}".lower().replace(" ", "")
            rows.append(
                {
                    "name": name,
                    "srn": f"PES2024{n:04d}",
                    "email": f"{local}@pes.edu",
                    "lat": f"{base_lat + dlat:.5f}",
                    "lng": f"{base_lng + dlng:.5f}",
                }
            )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["name", "srn", "email", "lat", "lng"])
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} students -> {OUT}")
    print("Pockets:")
    for label, lat, lng in POCKETS:
        print(f"  {label:22} {lat:.4f}, {lng:.4f}")


if __name__ == "__main__":
    main()
