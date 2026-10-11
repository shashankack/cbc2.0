"""Generate scripts/fixtures/pes_ring_road_students.csv (150 students).

Three corridor blobs around PES Ring Road, five neighborhood pickups each
(10 students per pickup).

Geometry rules (must match CampusSettings defaults):
  - Within a pocket: ~40–80 m jitter → one DBSCAN stop (eps 500 m)
  - Pocket centers ~750–900 m apart → separate stops, same corridor
  - Each corridor is a local blob so nearest-neighbor tour finishes it
    before jumping; blobs > ~2 km apart → exactly 3 packed routes

Run from backend/:  python scripts/generate_pes_students_csv.py
"""

from __future__ import annotations

import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent / "fixtures" / "pes_ring_road_students.csv"

# PES Ring Road depot ≈ 12.93424, 77.53432
# Compact blobs (local NN chains) far from each other (route splits).
CORRIDORS: list[tuple[str, list[tuple[str, float, float]]]] = [
    (
        "West — Kengeri / RR Nagar",
        [
            ("Kengeri Satellite", 12.9140, 77.4920),
            ("Jnanabharathi Cross", 12.9200, 77.4990),
            ("RR Nagar Arch", 12.9260, 77.5060),
            ("Pattanagere Signal", 12.9305, 77.5130),
            ("Nagarbhavi Circle", 12.9340, 77.5200),
        ],
    ),
    (
        "South — Banashankari / BTM",
        [
            ("BTM 2nd Stage", 12.9080, 77.6000),
            ("JP Nagar 5th Phase", 12.9130, 77.5900),
            ("Banashankari Temple", 12.9180, 77.5800),
            ("Kathriguppe Circle", 12.9230, 77.5700),
            ("Girinagar Park", 12.9275, 77.5600),
        ],
    ),
    (
        "North — Vijayanagar / Magadi",
        [
            ("Magadi Road Market", 12.9800, 77.5120),
            ("Vijayanagar Metro", 12.9730, 77.5180),
            ("Attiguppe Bridge", 12.9665, 77.5240),
            ("Deepanjali Nagar", 12.9605, 77.5295),
            ("Chord Road Junction", 12.9545, 77.5340),
        ],
    ),
]

FIRST = [
    "Aisha", "Rohan", "Priya", "Arjun", "Sneha", "Neha", "Diya", "Karan",
    "Kabir", "Meera", "Dev", "Ananya", "Vikram", "Ishaan", "Riya", "Aditya",
    "Sara", "Harsh", "Nisha", "Rahul", "Zara", "Omar", "Leela", "Manish",
    "Isha", "Varun", "Pooja", "Siddharth", "Kavya", "Aman", "Tanvi", "Nikhil",
    "Shruti", "Yash", "Anika", "Rajat", "Myra", "Kiran", "Sana", "Vivek",
    "Aarav", "Kiara", "Reyansh", "Aadhya", "Vivaan", "Anvi", "Shaurya", "Ira",
    "Atharv", "Navya", "Advait", "Mira", "Saanvi", "Dhruv", "Kabira", "Anikaa",
]
LAST = [
    "Khan", "Mehta", "Nair", "Rao", "Iyer", "Reddy", "Krishnan", "Malhotra",
    "Shah", "Joshi", "Patel", "Das", "Singh", "Gupta", "Menon", "Bose",
    "Ali", "Verma", "Pillai", "Desai", "Farooq", "Jain", "Chopra", "Bhat",
    "Shetty", "Kulkarni", "Hegde", "Nayak", "Prasad", "Mukherjee", "Shenoy",
    "Kamath", "Pai", "Gowda", "Shekar", "Banerjee",
]


def main() -> None:
    per_pocket = 10  # 3 × 5 × 10 = 150
    rows: list[dict[str, str]] = []
    n = 0
    used_names: set[str] = set()

    for _corridor, pockets in CORRIDORS:
        for _label, base_lat, base_lng in pockets:
            for j in range(per_pocket):
                n += 1
                dlat = ((j % 5) - 2) * 0.00012
                dlng = ((j // 5) - 1) * 0.00014 + (j % 3) * 0.00005
                first = FIRST[(n - 1) % len(FIRST)]
                last = LAST[(n * 3 + j) % len(LAST)]
                name = f"{first} {last}"
                if name in used_names:
                    name = f"{first} {last} {n}"
                used_names.add(name)
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
    print("Corridors (5 pickups x 10 students each):")
    for corridor, pockets in CORRIDORS:
        print(f"  {corridor}")
        for label, lat, lng in pockets:
            print(f"    - {label:24} {lat:.5f}, {lng:.5f}")


if __name__ == "__main__":
    main()
