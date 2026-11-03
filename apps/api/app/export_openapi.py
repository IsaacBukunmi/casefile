"""Write the API's OpenAPI schema to a file: `python -m app.export_openapi <path>`."""

import json
import os
import sys
from pathlib import Path

# The schema doesn't depend on these values, but the app refuses to start without them.
# Placeholders let the schema be exported anywhere (such as CI) without real credentials.
# setdefault keeps any real values already in the environment.
for name in ("DATABASE_URL", "CLERK_ISSUER", "CLERK_JWT_KEY"):
    os.environ.setdefault(name, "unused-for-schema-export")

from app.main import app  # noqa: E402


def main() -> None:
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    schema = json.dumps(app.openapi(), indent=2, ensure_ascii=False)
    out.write_text(schema + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
