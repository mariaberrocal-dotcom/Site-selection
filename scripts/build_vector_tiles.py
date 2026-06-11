#!/usr/bin/env python3
from pathlib import Path
import shutil

import geopandas as gpd
import pandas as pd
import pyogrio


MIN_ZOOM = 0
MAX_ZOOM = 8
OUT_DIR = Path(__file__).resolve().parent.parent / "vectiles"
SPLIT_OUT_DIRS = {
    5: Path(__file__).resolve().parent.parent / "vectiles_hbl5",
    7: Path(__file__).resolve().parent.parent / "vectiles_hbl7",
}
LAYER_NAME = "hydrobasins"
KEEP_PROPS = ["HYBAS_ID", "PFAF_ID", "ORDER"]


def read_level(path: Path, level: int) -> gpd.GeoDataFrame:
    gdf = gpd.read_feather(path)
    keep = [c for c in KEEP_PROPS if c in gdf.columns]
    gdf = gdf[keep + ["geometry"]].copy()
    gdf["level"] = level
    gdf = gdf[gdf.geometry.notnull()]
    gdf["geometry"] = gdf.geometry.make_valid()
    gdf = gdf[~gdf.geometry.is_empty]
    if gdf.crs is None:
        gdf = gdf.set_crs(4326)
    return gdf


def write_tileset(gdf: gpd.GeoDataFrame, out_dir: Path, name: str, description: str) -> int:
    if out_dir.exists():
        shutil.rmtree(out_dir)

    pyogrio.write_dataframe(
        gdf,
        str(out_dir),
        driver="MVT",
        layer=LAYER_NAME,
        dataset_options={
            "FORMAT": "DIRECTORY",
            "MINZOOM": str(MIN_ZOOM),
            "MAXZOOM": str(MAX_ZOOM),
            "EXTENT": "4096",
            "COMPRESS": "NO",
            "MAX_SIZE": "4000000",
            "MAX_FEATURES": "200000",
            "NAME": name,
            "DESCRIPTION": description,
        },
    )

    return sum(1 for _ in out_dir.rglob("*.pbf"))


def main() -> None:
    base = Path(__file__).resolve().parent.parent / "GeoLoc"
    gdf5 = read_level(base / "hybas05.feather", 5)
    gdf7 = read_level(base / "hybas07.feather", 7)
    gdf = gpd.GeoDataFrame(pd.concat([gdf5, gdf7], ignore_index=True), crs=gdf5.crs)

    combined_count = write_tileset(
        gdf,
        OUT_DIR,
        "hydrobasins",
        "HydroBASINS levels 5 and 7",
    )
    split_counts = {
        5: write_tileset(gdf5, SPLIT_OUT_DIRS[5], "hydrobasins_hbl5", "HydroBASINS level 5"),
        7: write_tileset(gdf7, SPLIT_OUT_DIRS[7], "hydrobasins_hbl7", "HydroBASINS level 7"),
    }

    print(f"Vector tiles listos en: {OUT_DIR}")
    print(f"Tiles .pbf combinados generados: {combined_count}")
    print(f"Tiles .pbf HBL5 generados: {split_counts[5]} ({SPLIT_OUT_DIRS[5]})")
    print(f"Tiles .pbf HBL7 generados: {split_counts[7]} ({SPLIT_OUT_DIRS[7]})")
    print(f"MinZoom: {MIN_ZOOM} | MaxZoom: {MAX_ZOOM}")


if __name__ == "__main__":
    main()
