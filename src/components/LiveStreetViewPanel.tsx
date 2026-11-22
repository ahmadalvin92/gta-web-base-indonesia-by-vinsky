"use client";

import React, { useEffect, useState } from "react";
import { Camera, ExternalLink, MapPin, Navigation, RefreshCw } from "lucide-react";
import { JabodetabekRegion, latLngToOsmTile } from "@/game/JabodetabekMapFetcher";

interface StreetPhotoItem {
  title: string;
  imageUrl: string;
  distMeters: number;
  source: string;
}

interface LiveStreetViewPanelProps {
  gps: { lat: number; lng: number };
  region: JabodetabekRegion;
  onTakeScreenshot: () => void;
}

export const LiveStreetViewPanel: React.FC<LiveStreetViewPanelProps> = ({
  gps,
  region,
  onTakeScreenshot,
}) => {
  const [photos, setPhotos] = useState<StreetPhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedKey, setLastFetchedKey] = useState("");

  const fetchNearbyStreetImages = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      // 1. Free Wikimedia Commons Geosearch (CORS-friendly, zero API key)
      const geoUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat.toFixed(
        4
      )}|${lng.toFixed(4)}&gsradius=1500&gslimit=4&gsnamespace=6&format=json&origin=*`;
      const res = await fetch(geoUrl);
      if (res.ok) {
        const data = await res.json();
        const hits = data?.query?.geosearch;
        if (Array.isArray(hits) && hits.length > 0) {
          const pageIds = hits.map((h: { pageid: number }) => h.pageid).join("|");
          const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageIds}&prop=imageinfo&iiprop=url|mime&iiurlwidth=640&format=json&origin=*`;
          const infoRes = await fetch(infoUrl);
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            const pages = infoData?.query?.pages || {};
            const parsed: StreetPhotoItem[] = [];
            for (const h of hits) {
              const p = pages[String(h.pageid)];
              const ii = p?.imageinfo?.[0];
              if (ii?.thumburl && (!ii.mime || String(ii.mime).startsWith("image/"))) {
                parsed.push({
                  title: String(h.title || region.title).replace("File:", "").replace(/\.[^/.]+$/, ""),
                  imageUrl: ii.thumburl,
                  distMeters: Math.round(h.dist || 0),
                  source: "Wikimedia Street Geotag (OSM)",
                });
              }
            }
            if (parsed.length > 0) {
              setPhotos(parsed);
              setLoading(false);
              return;
            }
          }
        }
      }
    } catch {
      // graceful fallback
    }
    setLoading(false);
  };

  useEffect(() => {
    const bucketKey = `${gps.lat.toFixed(3)}_${gps.lng.toFixed(3)}`;
    if (bucketKey !== lastFetchedKey) {
      setLastFetchedKey(bucketKey);
      fetchNearbyStreetImages(gps.lat, gps.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps.lat, gps.lng]);

  const streetView360Url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${gps.lat.toFixed(
    6
  )},${gps.lng.toFixed(6)}`;
  const osmTile = latLngToOsmTile(gps.lat, gps.lng, 16);

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border border-cyan-500/35 bg-slate-900/90 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
            <MapPin className="h-3.5 w-3.5" /> Live Street View Jakarta
          </span>
          <button
            onClick={() => fetchNearbyStreetImages(gps.lat, gps.lng)}
            className="rounded-lg bg-white/10 p-1 text-slate-300 hover:bg-white/20"
            title="Refresh Foto Lokasi"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <p className="mt-1 text-xs font-bold text-white">{region.title}</p>
        <p className="font-mono text-[11px] text-emerald-300">
          GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
        </p>

        {/* Real Jakarta Photo Preview from Geo-API */}
        <div className="mt-2.5 overflow-hidden rounded-xl border border-white/15 bg-slate-950">
          {photos.length > 0 ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[0].imageUrl}
                alt={photos[0].title}
                className="h-36 w-full object-cover"
              />
              <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 absolute inset-x-0 bottom-0">
                <p className="truncate text-[11px] font-bold text-white">{photos[0].title}</p>
                <p className="text-[10px] text-cyan-300">
                  {photos[0].source} • {photos[0].distMeters}m dari mobil
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-36 w-full overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:14px_14px] bg-slate-900">
              <div className="grid grid-cols-3 grid-rows-3 h-full w-full">
                {[-1, 0, 1].map((dy) =>
                  [-1, 0, 1].map((dx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${dx}_${dy}`}
                      src={`https://tile.openstreetmap.org/${osmTile.zoom}/${
                        osmTile.x + dx
                      }/${osmTile.y + dy}.png`}
                      alt="OpenStreetMap Live"
                      onError={(e) => {
                        e.currentTarget.style.opacity = "0";
                      }}
                      className="h-full w-full object-cover"
                    />
                  ))
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Navigation className="h-5 w-5 text-pink-500 fill-pink-500 drop-shadow" />
              </div>
              <div className="absolute bottom-1 left-2 rounded bg-black/75 px-2 py-0.5 text-[10px] text-cyan-200">
                Live OSM Radar ({region.areaLabel})
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-2.5 grid grid-cols-1 gap-2">
          <button
            onClick={onTakeScreenshot}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-orange-500 px-3 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition"
          >
            <Camera className="h-3.5 w-3.5" />
            Ambil Foto / Screenshot Jakarta (.PNG)
          </button>

          <a
            href={streetView360Url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Buka Google Street View 360° (Gratis)
          </a>
        </div>
      </div>
    </div>
  );
};
