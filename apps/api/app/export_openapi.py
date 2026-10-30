"""Write the API's OpenAPI schema to a file: `python -m app.export_openapi <path>`."""

import json
import sys
from pathlib import Path

from app.main import app


def main() -> None:
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    schema = json.dumps(app.openapi(), indent=2, ensure_ascii=False)
    out.write_text(schema + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
