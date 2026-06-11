# Maps Prototype

Static Waterplan maps prototype with generated GeoJSON data, SVG assets, and local vector tiles.

## Run locally

Serve the folder with any static file server, for example:

```sh
python3 -m http.server 8773
```

Then open:

```text
http://127.0.0.1:8773/hybrid-prototype.html
```

## Notes

- `mapboxtoken.txt` is intentionally ignored because it contains a local access token.
- Large HydroBASINS source files under `GeoLoc/` are intentionally ignored. The generated vector tiles used by the prototype live in `vectiles/`.
- `tiles/`, `vt_test/`, and `vt_test2/` are local scratch outputs and are not required by the current prototype.
