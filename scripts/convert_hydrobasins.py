#!/usr/bin/env python3
from pathlib import Path

import geopandas as gpd


def convert(src: Path, dst: Path) -> None:
    print(f"Leyendo {src}...")
    gdf = gpd.read_feather(src)
    print(f"Filas: {len(gdf):,}")

    print(f"Exportando {dst}...")
    gdf.to_file(dst, driver="GeoJSON")
    print(f"Listo: {dst} ({dst.stat().st_size / (1024 * 1024):.1f} MB)")


def main() -> None:
    base = Path(__file__).resolve().parent.parent / "GeoLoc"
    pairs = [
        (base / "hybas05.feather", base / "hybas05.geojson"),
        (base / "hybas07.feather", base / "hybas07.geojson"),
    ]

    for src, dst in pairs:
        if not src.exists():
            raise FileNotFoundError(f"No existe {src}")
        convert(src, dst)


if __name__ == "__main__":
    main()
