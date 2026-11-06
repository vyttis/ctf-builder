"""Build lib/data/schools.json from the open Lithuanian education warehouse.

Source: the DuckDB warehouse behind mcp.svietimas.lt (ŠVIS / data.gov.lt
dataset 2687, "Mokiniai einamiesiems mokslo metams"). Only operating
general-education schools, without branches.

Usage: python scripts/update-schools.py <warehouse.db> <output.json>
(the workflow downloads the file with curl first)
"""
import datetime
import json
import os
import sys

import duckdb

db, out = sys.argv[1], sys.argv[2]
con = duckdb.connect(db, read_only=True)
rows = con.sql(
    """
    select mokyklos_kodas, mokykla, savivaldybe, savivaldybes_kodas,
           tipo_grupe, tipas, priklausomybes_tipo_grupe
    from mokyklos
    where ar_veikianti_mokykla and not ar_padalinys
    order by savivaldybe, mokykla
    """
).fetchall()
if len(rows) < 500:
    sys.exit(f"Only {len(rows)} schools found, refusing to write")

schools = [
    {
        "code": str(r[0]),
        "name": r[1],
        "municipality": r[2],
        "municipalityCode": int(r[3]) if r[3] is not None else None,
        "type": r[4],
        "subtype": r[5],
        "ownership": r[6],
    }
    for r in rows
]
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(
        {
            "source": "ŠVIS per data.gov.lt (rinkinys 2687), mcp.svietimas.lt sandėlis",
            "updatedAt": datetime.date.today().isoformat(),
            "schools": schools,
        },
        f,
        ensure_ascii=False,
        separators=(",", ":"),
    )
print(f"wrote {len(schools)} schools to {out}")
