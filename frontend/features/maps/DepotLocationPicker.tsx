"use client";

import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Marker, Popup } from "react-leaflet";
import {
  MapCanvas,
  MapClickCapture,
  MapLegend,
  type MapLatLng,
} from "@/components/maps";
import { depotIcon } from "@/components/maps/leafletIcons";
import { DEFAULT_MAP_CENTER, roundCoord } from "./geo";
import { searchPlaces, type PlaceHit } from "./searchPlaces";

export type DepotLocationPickerProps = {
  value: MapLatLng | null;
  onChange: (point: MapLatLng) => void;
  height?: number;
};

export default function DepotLocationPicker({
  value,
  onChange,
  height = 360,
}: DepotLocationPickerProps) {
  const center = value ?? DEFAULT_MAP_CENTER;
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setOptions([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q)
        .then((hits) => {
          if (!cancelled) {
            setOptions(hits);
            setSearchError(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
            setSearchError("Search unavailable. Try again or click the map.");
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <Stack spacing={1.5}>
      <Autocomplete
        options={options}
        filterOptions={(x) => x}
        getOptionLabel={(opt) => opt.label}
        loading={searching}
        noOptionsText={
          query.trim().length < 2
            ? "Type at least 2 characters"
            : searching
              ? "Searching…"
              : "No places found"
        }
        onInputChange={(_e, value, reason) => {
          if (reason === "input" || reason === "clear") setQuery(value);
        }}
        onChange={(_e, hit) => {
          if (!hit) return;
          onChange({
            lat: roundCoord(hit.lat),
            lng: roundCoord(hit.lng),
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search place or address"
            placeholder="e.g. PES University"
            helperText={
              searchError ??
              "OpenStreetMap search (India / Bangalore biased). Select a result, then Apply & save."
            }
            error={Boolean(searchError)}
          />
        )}
      />
      <Typography variant="caption" color="text.secondary">
        Or click the map to fine-tune the pin.
      </Typography>
      <MapCanvas
        center={center}
        zoom={value ? 16 : 12}
        height={height}
        showApproxDisclaimer={false}
        legend={
          <MapLegend
            items={[{ id: "depot", color: "#0B3D91", label: "Campus depot" }]}
          />
        }
      >
        <MapClickCapture
          invalidateOnMount
          onPick={(point) =>
            onChange({ lat: roundCoord(point.lat), lng: roundCoord(point.lng) })
          }
        />
        {value ? (
          <Marker position={[value.lat, value.lng]} icon={depotIcon()}>
            <Popup>
              <strong>Campus depot</strong>
              <div>
                {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapCanvas>
    </Stack>
  );
}
