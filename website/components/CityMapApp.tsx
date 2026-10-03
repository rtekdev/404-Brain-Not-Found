"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";
import { Radio, Sparkles } from "lucide-react";
import MapView, { boundsOf, type CityGeo } from "./map/MapView";
import MarkerOverlay from "./map/MarkerOverlay";
import MapPopup from "./map/MapPopup";
import TopBar, { LAYER_DEFS, type LayerId } from "./TopBar";
import EventsPanel, { type SimKind } from "./EventsPanel";
import IntakeSimulator from "./IntakeSimulator";
import type { IntakeDraft } from "@/lib/intake";
import ResourcesPanel from "./ResourcesPanel";
import SidePanel, { type Mode } from "./SidePanel";
import FlowOverlay from "./map/FlowOverlay";
import ReportDialog from "./ReportDialog";
import CameraFeed from "./CameraFeed";
import { Legend, ZoomControls } from "./Legend";
import { ACCESS_POINTS, ASSETS, CAMERAS, CAMERA_EVENTS, INTAKE_SCENARIOS, buildReports, type IntakeScenario } from "@/lib/demo-data";
import { classify } from "@/lib/classify";
import { scoreReport, type PriorityResult } from "@/lib/priority";
import { ACCESS_LABEL, ASSET_LABEL, CATEGORY_LABEL, unitById, unitForCategory } from "@/lib/meta";
import { METRIC, assetMeter, fmt, meterAt, sectorReading, type Reading } from "@/lib/resources";
import { applyTransfers, estimate, type Transfer } from "@/lib/transfer";
import type { Draft } from "./TransferPlanner";
import type { LngLat, Metric, Place, Report, Sector, Status } from "@/lib/types";

export type ScoredReport = Report & { priority: PriorityResult };
export type Selection = { type: "report" | "camera" | "asset" | "access"; id: string };

const CITY = { slug: "krakow", name: "Kraków" };
const PANEL_W = 400;

interface Loaded extends CityGeo {
  sectorList: Sector[];
  places: Place[];
}

async function loadCity(slug: string): Promise<Loaded> {
  const get = (f: string) => fetch(`/data/${slug}/${f}.geojson`).then((r) => r.json());
  const [boundary, sectors, places] = await Promise.all([get("boundary"), get("sectors"), get("places")]);
  const sc = sectors as FeatureCollection<Polygon | MultiPolygon>;
  return {
    boundary,
    sectors: sc,
    sectorList: sc.features
      .map((f) => ({
        id: f.properties!.id,
        name: f.properties!.name,
        areaKm2: f.properties!.areaKm2,
        anchor: f.properties!.anchor,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    places: (places as FeatureCollection<Point>).features.map((f) => ({
      name: f.properties!.name,
      sector: f.properties!.sector,
      position: f.geometry.coordinates as LngLat,
    })),
  };
}

function isDesktop() {
  return typeof window !== "undefined" && window.innerWidth >= 640;
}

export default function CityMapApp() {
  const [geo, setGeo] = useState<Loaded | null>(null);
  const [map, setMap] = useState<MlMap | null>(null);
  const [reports, setReports] = useState<Report[]>(() => buildReports());
  const [now, setNow] = useState(() => Date.now());
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(
    () => Object.fromEntries(LAYER_DEFS.map((l) => [l.id, true])) as Record<LayerId, boolean>,
  );
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dialog, setDialog] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<LngLat | null>(null);
  const [simIndex, setSimIndex] = useState(0);
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const [mode, setMode] = useState<Mode>("zgloszenia");
  const [intake, setIntake] = useState<IntakeScenario | null>(null);
  const [metric, setMetric] = useState<Metric>("energia");
  const [t, setT] = useState(() => Date.now());
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transferDraft, setDraftTransfer] = useState<Draft | null>(null);

  // Odczyty zasobów „na żywo" — tykanie tylko w widoku zasobów.
  useEffect(() => {
    if (mode !== "zasoby") return;
    const i = setInterval(() => setT(Date.now()), 1500);
    return () => clearInterval(i);
  }, [mode]);

  useEffect(() => {
    loadCity(CITY.slug).then(setGeo);
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sectorOf = useCallback(
    (pos: LngLat): string | null => {
      if (!geo) return null;
      const pt: Feature<Point> = { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: pos } };
      return geo.sectors.features.find((f) => booleanPointInPolygon(pt, f))?.properties?.id ?? null;
    },
    [geo],
  );

  const scored = useMemo<ScoredReport[]>(
    () => reports.map((r) => ({ ...r, sector: r.sector ?? sectorOf(r.position), priority: scoreReport(r, now) })),
    [reports, now, sectorOf],
  );
  const cameras = useMemo(() => CAMERAS.map((c) => ({ ...c, sector: sectorOf(c.position) })), [sectorOf]);
  const assets = useMemo(() => ASSETS.map((a) => ({ ...a, sector: sectorOf(a.position) })), [sectorOf]);
  const access = useMemo(() => ACCESS_POINTS.map((a) => ({ ...a, sector: sectorOf(a.position) })), [sectorOf]);

  const readingsAt = useCallback(
    (at: number, withTransfers = true): Record<string, Reading> => {
      const list = geo?.sectorList ?? [];
      const base = Object.fromEntries(list.map((s) => [s.id, sectorReading(s.id, metric, assets, at)]));
      return withTransfers ? applyTransfers(base, transfers, metric, list) : base;
    },
    [geo, metric, assets, transfers],
  );
  const baseReadings = useMemo(() => readingsAt(t, false), [readingsAt, t]);
  const readings = useMemo(() => readingsAt(t), [readingsAt, t]);

  const sectorCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of scored) if (r.status !== "zamkniete" && r.sector) out[r.sector] = (out[r.sector] ?? 0) + 1;
    return out;
  }, [scored]);

  const padding = () =>
    isDesktop() ? { top: 90, bottom: 60, left: 40, right: PANEL_W + 30 } : { top: 80, bottom: window.innerHeight * 0.45, left: 20, right: 20 };

  const flyTo = (pos: LngLat, zoom = 15) => map?.flyTo({ center: pos, zoom: Math.max(map.getZoom(), zoom), padding: padding(), duration: 900 });

  const selectSector = (id: string | null) => {
    setSelectedSector(id);
    if (!map || !geo) return;
    const f = id ? geo.sectors.features.find((s) => s.properties?.id === id) : geo.boundary;
    if (f) map.fitBounds(boundsOf(f), { padding: padding(), duration: 900 });
  };

  const select = (s: Selection | null) => {
    setSelection(s);
    if (!s) return;
    const pos =
      s.type === "report" ? scored.find((r) => r.id === s.id)?.position
      : s.type === "camera" ? cameras.find((c) => c.id === s.id)?.position
      : s.type === "asset" ? assets.find((a) => a.id === s.id)?.position
      : access.find((a) => a.id === s.id)?.position;
    if (pos) flyTo(pos, 14);
  };

  const updateReport = (id: string, patch: { status?: Status; unitId?: string | null }) =>
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addReport = (r: Omit<Report, "id" | "createdAt" | "sector">) => {
    const id = `Z-${1024 + reports.length}`;
    setReports((rs) => [{ ...r, id, createdAt: Date.now(), sector: null }, ...rs]);
    setNow(Date.now());
    return id;
  };

  const simulateIntake = (kind: SimKind) => {
    if (kind === "kamera") return simulate();
    setMode("zgloszenia");
    setSelection(null);
    setIntake(INTAKE_SCENARIOS.find((s) => s.channel === kind) ?? null);
  };

  const acceptIntake = (d: IntakeDraft) => {
    if (!intake) return;
    const channel = intake.channel;
    setIntake(null);
    if (!d.position) {
      // Bez miejsca w wiadomości dyspozytor wskazuje je na mapie w zwykłym formularzu.
      setDialog(true);
      setPicking(true);
      return;
    }
    const id = addReport({
      title: d.title,
      description: d.description,
      category: d.category,
      source: channel,
      status: "nowe",
      position: d.position,
      unitId: null,
      confirmations: 1,
      blocking: d.blocking,
      confidence: d.confidence,
    });
    setToast({ id, text: `${channel === "telegram" ? "Telegram" : "Telefon"}: przyjęto ${id} · ${CATEGORY_LABEL[d.category]}` });
    setSelection({ type: "report", id });
    flyTo(d.position, 14.5);
  };

  const simulate = () => {
    const ev = CAMERA_EVENTS[simIndex % CAMERA_EVENTS.length];
    setSimIndex((i) => i + 1);
    const id = addReport({
      title: ev.title,
      description: ev.description,
      category: ev.category,
      source: "kamera",
      status: "nowe",
      position: ev.position,
      unitId: null,
      confirmations: 1,
      blocking: ev.blocking ?? false,
      cameraId: ev.cameraId,
      confidence: ev.confidence ?? 0.85,
    });
    setMode("zgloszenia");
    setToast({ id, text: `Kamera ${ev.cameraId}: ${ev.title}` });
    setSelection({ type: "report", id });
    flyTo(ev.position, 14.5);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const submitReport = (d: { title: string; description: string; blocking: boolean }) => {
    if (!draft) return;
    const c = classify(d.description);
    const id = addReport({
      title: d.title,
      description: d.description,
      category: c.category,
      source: "aplikacja",
      status: "nowe",
      position: draft,
      unitId: null,
      confirmations: 1,
      blocking: d.blocking,
      confidence: c.confidence,
    });
    setDialog(false);
    setDraft(null);
    setMode("zgloszenia");
    setToast({ id, text: `Przyjęto zgłoszenie ${id} · ${CATEGORY_LABEL[c.category]}` });
    setSelection({ type: "report", id });
  };

  if (!geo) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-muted">Ładowanie mapy miasta…</div>
    );
  }

  const selCamera = selection?.type === "camera" ? cameras.find((c) => c.id === selection.id) : undefined;
  const selAsset = selection?.type === "asset" ? assets.find((a) => a.id === selection.id) : undefined;
  const selAccess = selection?.type === "access" ? access.find((a) => a.id === selection.id) : undefined;
  const cameraReport = selCamera && scored.find((r) => r.cameraId === selCamera.id && r.status !== "zamkniete");
  const resources = mode === "zasoby";
  // Zgłoszenia i zasoby to osobne widoki mapy — warstwy z menu działają w obrębie widoku.
  const visible = {
    ...layers,
    sectors: layers.sectors && !resources,
    reports: layers.reports && !resources,
    cameras: layers.cameras && !resources,
    access: layers.access && !resources,
    assets: layers.assets && resources,
  };

  return (
    <main className="relative min-h-0 flex-1 overflow-hidden">
      <MapView
        geo={geo}
        showBoundary={layers.boundary}
        showSectors={layers.sectors}
        selectedSector={selectedSector}
        picking={picking}
        paddingRight={PANEL_W}
        onReady={setMap}
        onSectorClick={(id) => {
          setSelection(null);
          setSelectedSector(id);
        }}
        onPick={(pos) => {
          setDraft(pos);
          setPicking(false);
        }}
      />

      {map && (
        <>
          <MarkerOverlay
            map={map}
            layers={visible}
            sectors={geo.sectorList}
            selectedSector={selectedSector}
            reports={scored}
            cameras={cameras}
            assets={assets}
            access={access}
            selection={selection}
            draft={dialog ? draft : null}
            onSelect={select}
            onSectorClick={(id) => selectSector(selectedSector === id ? null : id)}
            assetFocus={resources ? (a) => !!assetMeter(a, metric) : undefined}
          />

          {resources && (
            <FlowOverlay
              map={map}
              metric={metric}
              sectors={geo.sectorList}
              readings={readings}
              assets={assets}
              selectedSector={selectedSector}
              t={t}
              routes={[
                ...transfers
                  .filter((x) => x.metric === metric)
                  .map((x) => ({ id: x.id, from: x.from, to: x.to, value: estimate(x, baseReadings, geo.sectorList)?.delivered ?? 0, preview: false })),
                ...(transferDraft && transferDraft.from !== transferDraft.to
                  ? [{ id: "draft", from: transferDraft.from, to: transferDraft.to, value: estimate({ metric, ...transferDraft }, baseReadings, geo.sectorList)?.delivered ?? 0, preview: true }]
                  : []),
              ]}
              onSectorClick={(id) => selectSector(selectedSector === id ? null : id)}
            />
          )}

          {selCamera && (
            <MapPopup map={map} at={selCamera.position} title={`Kamera · ${selCamera.name}`} onClose={() => setSelection(null)} width={selCamera.live ? 380 : 260}>
              <CameraFeed
                seed={selCamera.id}
                offline={!selCamera.online}
                live={selCamera.live}
                detection={cameraReport ? { label: cameraReport.title, confidence: cameraReport.confidence, category: cameraReport.category } : undefined}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{selCamera.id} · sektor {selCamera.sector}</span>
                {cameraReport ? (
                  <button type="button" onClick={() => setSelection({ type: "report", id: cameraReport.id })} className="font-medium text-accent-soft hover:underline">
                    Otwórz zgłoszenie →
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400"><Sparkles size={12} aria-hidden /> brak zdarzeń</span>
                )}
              </div>
            </MapPopup>
          )}

          {selAsset && (
            <MapPopup map={map} at={selAsset.position} title={selAsset.name} onClose={() => setSelection(null)}>
              <div className="text-xs text-muted">{ASSET_LABEL[selAsset.kind]} · {unitById(selAsset.unitId)?.name}</div>
              {selAsset.kind !== "sprzet" && selAsset.kind !== "ladowarka" && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${selAsset.level}%`, background: selAsset.level >= 85 ? "#f59e0b" : "#22d3ee" }}
                  />
                </div>
              )}
              <div className="mt-1.5 text-sm">{selAsset.levelLabel}</div>
              {selAsset.meters?.map((m) => {
                const d = METRIC[m.metric];
                const v = meterAt(m, selAsset.id, t);
                return (
                  <div key={m.metric} className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted">{d.label}</span>
                    <span className="tabular-nums" style={{ color: d.color }}>
                      {v.secondary > 0 ? `+${fmt(v.secondary, m.metric)}` : fmt(v.primary, m.metric)} {d.unit}
                    </span>
                  </div>
                );
              })}
              {selAsset.level >= 85 && selAsset.kind !== "sprzet" && (
                <div className="mt-2 rounded-md bg-amber-500/15 px-2 py-1 text-xs text-amber-300">AI: zaplanuj interwencję w ciągu 24 h</div>
              )}
            </MapPopup>
          )}

          {selAccess && (
            <MapPopup map={map} at={selAccess.position} title={selAccess.name} onClose={() => setSelection(null)}>
              <div className="text-xs text-muted">{ACCESS_LABEL[selAccess.kind]} · sektor {selAccess.sector}</div>
              <div className={`mt-2 text-sm font-medium ${selAccess.ok ? "text-sky-300" : "text-rose-300"}`}>
                {selAccess.ok ? "Dostępne" : "Niedostępne — zgłoszone do " + unitForCategory("dostepnosc").short}
              </div>
            </MapPopup>
          )}
        </>
      )}

      <TopBar
        city={CITY.name}
        layers={layers}
        onToggleLayer={(id) => setLayers((l) => ({ ...l, [id]: !l[id] }))}
        sectors={geo.sectorList}
        sectorCounts={sectorCounts}
        selectedSector={selectedSector}
        onSector={selectSector}
        places={geo.places}
        reports={scored}
        cameras={cameras}
        onGo={(pos, sel) => {
          if (sel) select(sel);
          else flyTo(pos, 15);
        }}
      />

      {dialog && (
        <ReportDialog
          position={draft}
          sector={draft ? sectorOf(draft) : null}
          onPickStart={() => setPicking(true)}
          onCancel={() => {
            setDialog(false);
            setPicking(false);
            setDraft(null);
          }}
          onSubmit={submitReport}
        />
      )}

      {intake && (
        <IntakeSimulator
          key={intake.channel}
          scenario={intake}
          places={geo.places}
          sectorLabel={(pos) => {
            const id = sectorOf(pos);
            return id ? `${id} ${geo.sectorList.find((x) => x.id === id)?.name ?? ""}` : "poza dzielnicami";
          }}
          onAccept={acceptIntake}
          onClose={() => setIntake(null)}
        />
      )}

      {picking && (
        <div className="glass absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full px-4 py-2 text-sm">
          Kliknij na mapie, gdzie jest problem
        </div>
      )}

      <SidePanel
        mode={mode}
        onMode={(m) => {
          setMode(m);
          setSelection(null);
          setT(Date.now());
        }}
        openReports={scored.filter((r) => r.status !== "zamkniete").length}
      >
        {resources ? (
          <ResourcesPanel
            metric={metric}
            onMetric={(m) => {
              setMetric(m);
              setDraftTransfer(null);
            }}
            sectors={geo.sectorList}
            readings={readings}
            readingsAt={readingsAt}
            base={baseReadings}
            transfers={transfers}
            draft={transferDraft}
            onDraft={setDraftTransfer}
            onApply={(d) => {
              setTransfers((ts) => [...ts, { id: `T${Date.now()}`, metric, ...d }]);
              setDraftTransfer(null);
            }}
            onRemoveTransfer={(id) => setTransfers((ts) => ts.filter((x) => x.id !== id))}
            assets={assets}
            reports={scored}
            t={t}
            selectedSector={selectedSector}
            onSector={selectSector}
            onSelectAsset={(id) => select({ type: "asset", id })}
            onOpenReport={(id) => {
              setMode("zgloszenia");
              select({ type: "report", id });
            }}
          />
        ) : (
      <EventsPanel
        reports={scored}
        now={now}
        selectedId={selection?.type === "report" ? selection.id : null}
        sectorFilter={selectedSector}
        onClearSector={() => selectSector(null)}
        sectors={geo.sectorList}
        onSector={(id) => selectSector(id)}
        onSelect={(id) => select(id ? { type: "report", id } : null)}
        onUpdate={updateReport}
        onNewReport={() => {
          setSelection(null);
          setDialog(true);
          setPicking(true);
        }}
        onSimulate={simulateIntake}
      />
        )}
      </SidePanel>

      <Legend mode={mode} metric={metric} />
      <ZoomControls onZoom={(d) => (d > 0 ? map?.zoomIn() : map?.zoomOut())} />

      {toast && (
        <div
          role="status"
          className="glass animate-slide-in absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm sm:bottom-6"
        >
          <Radio size={15} className="text-rose-400" aria-hidden />
          {toast.text}
        </div>
      )}
    </main>
  );
}
