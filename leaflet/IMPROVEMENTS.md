# Leaflet Demo Improvement Ideas

These suggestions keep the existing `leaflet/` demo intact while outlining how
an enhanced variant (for example, a `leaflet-next/` directory) could expand the
experience without altering the original.

## UX and accessibility
- Add color-vision deficiency simulator (protanopia/deuteranopia/tritanopia) to
  preview palette legibility before applying it to the map.
- Provide contrast checks on legend swatches with WCAG pass/fail indicators and
  recommendations for better readability.
- Introduce a dark-mode toggle with palette inversion guidance so base maps and
  overlays remain distinguishable in low-light contexts.

## Data and classification controls
- Support multiple classification methods (quantile, natural breaks, equal
  interval) and show live class break values so users understand how the data is
  being bucketed.
- Let users upload their own GeoJSON and numeric attribute, then generate
  on-the-fly classes using the selected scheme and method.
- Add presets for common thematic layers (e.g., population density, median
  income) sourced from hosted GeoJSON to demonstrate palettes on varied data
  shapes.

## Map interaction
- Include basemap switching (street, terrain, grayscale) so users can evaluate
  palettes against different contexts.
- Add hover tooltips that display the feature name, the bucket label, and the
  underlying numeric value for immediate feedback.
- Provide a mini-legend scrubber that highlights the associated map features
  when a swatch is hovered.

## Export and sharing
- Offer PNG/SVG exports of the legend and a postcard-style map snapshot that
  captures the viewport with the current palette.
- Generate shareable URLs by encoding palette, class count, layer choice, and
  map view parameters so configurations can be bookmarked or sent to others.
- Produce ready-to-use map style snippets (Mapbox GL JS / MapLibre) alongside the
  existing CSS and JS snippets.

## Performance and offline use
- Lazy-load heavy GeoJSON layers and cache them in `localStorage` for faster
  toggling between datasets.
- Add a service worker to make the demo usable offline after first load and to
  cache palette metadata.
- Use vector tiles for large datasets when available to keep panning/zooming
  responsive while applying ColorBrewer fills client-side.
