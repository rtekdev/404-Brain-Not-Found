"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as MlMap } from "maplibre-gl";
import { Radio, Sparkles } from "lucide-react";
import MapView, { boundsOf } from "./map/MapView";
import MarkerOverlay from "./map/MarkerOverlay";
import MapPopup from "./map/MapPopup";
import TopBar, { LAYER_DEFS, type LayerId } from "./TopBar";
import EventsPanel from "./EventsPanel";
import ResourcesPanel from "./ResourcesPanel";
import SidePanel, { type Mode } from "./SidePanel";
import FlowOverlay from "./map/FlowOverlay";
import ReportDialog from "./ReportDialog";
import CameraFeed from "./CameraFeed";
import { Legend, ZoomControls } from "./Legend";
import { SCRIPTED_CITY, localAlertReports } from "@/lib/simulation";
import type { CityData, CityOutline, CityRef } from "@/lib/city-repo";
import OtherCities from "./map/OtherCities";
import { sectorOf as sectorOfPoint } from "@/lib/rows";
import { createReportAction, reportsSinceAction, simulateAlertAction, updateReportAction } from "@/app/centrum/actions";
import AlertCenter from "./AlertCenter";
import { pickAlert, responsePlan, type Plan, type Step } from "@/lib/response";
import { classify } from "@/lib/classify";
import { scoreReport, type PriorityResult } from "@/lib/priority";
import { ACCESS_LABEL, ASSET_LABEL, CATEGORY_LABEL, unitById, unitForCategory } from "@/lib/meta";
import { METRIC, assetMeter, fmt, hubFor, meterAt, sectorReading, type Reading } from "@/lib/resources";
import { applyTransfers, distanceKm, estimate, type Transfer } from "@/lib/transfer";
import type { Draft } from "./TransferPlanner";
import type { LngLat, Metric, Report, Status } from "@/lib/types";

export type ScoredReport = Report & { priority: PriorityResult };
export type Selection = { type: "report" | "camera" | "asset" | "access"; id: string };

const PANEL_W = 400;

function isDesktop() {
  return typeof window !== "undefined" && window.innerWidth >= 640;
}

export default function CityMapApp({ city, cities, others }: { city: CityData; cities: CityRef[]; others: CityOutline[] }) {
  const router = useRouter();
  // Dane miasta przychodzą z bazy (strona serwerowa /centrum).
  const geo = useMemo(
    () => ({
      boundary: city.boundary,
      sectors: { type: "FeatureCollection" as const, features: city.sectorFeatures },
      sectorList: city.sectors,
      places: city.places,
      others: {
        type: "FeatureCollection" as const,
        features: others.map((o) => ({ ...o.boundary, properties: { slug: o.slug, name: o.name } })),
      },
    }),
    [city, others],
  );
  const switchCity = (slug: string) => router.push(`/centrum?miasto=${slug}`);
  const { cameras, assets, access } = city;
  const [map, setMap] = useState<MlMap | null>(null);
  const [reports, setReports] = useState<Report[]>(city.reports);
  const [now, setNow] = useState(() => Date.now());
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(
    () => Object.fromEntries(LAYER_DEFS.map((l) => [l.id, true])) as Record<LayerId, boolean>,
  );
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dialog, setDialog] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<LngLat | null>(null);
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const [mode, setMode] = useState<Mode>("zgloszenia");
  // Powiadomienia o nowych zgłoszeniach z bazy (inne kanały, symulacja alarmu).
  const [alertIds, setAlertIds] = useState<string[]>([]);
  const [doneSteps, setDoneSteps] = useState<Set<string>>(() => new Set());
  const knownIds = useRef(new Set(city.reports.map((r) => r.id)));
  const lastSeen = useRef(Math.max(0, ...city.reports.map((r) => r.createdAt)));
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
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sectorOf = useCallback((pos: LngLat) => sectorOfPoint(pos, city.sectorFeatures), [city]);

  const scored = useMemo<ScoredReport[]>(
    () => reports.map((r) => ({ ...r, priority: scoreReport(r, now) })),
    [reports, now],
  );

  const readingsAt = useCallback(
    (at: number, withTransfers = true): Record<string, Reading> => {
      const list = geo.sectorList;
      const base = Object.fromEntries(list.map((s) => [s.id, sectorReading(s, metric, assets, at)]));
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

  /** Nowe zgłoszenia → stan + komunikat. */
  const announce = useCallback((fresh: Report[]) => {
    if (fresh.length === 0) return;
    for (const r of fresh) {
      knownIds.current.add(r.id);
      lastSeen.current = Math.max(lastSeen.current, r.createdAt);
    }
    setReports((rs) => [...fresh, ...rs]);
    setNow(Date.now());
    setAlertIds((ids) => [...ids, ...fresh.map((r) => r.id)]);
  }, []);

  const poll = useCallback(async () => {
    try {
      // Baza ma zgłoszenia wszystkich miast — bierzemy tylko te z sektorów tego miasta.
      const mine = new Set(city.sectors.map((s) => s.id));
      announce((await reportsSinceAction(lastSeen.current)).filter((r) => !knownIds.current.has(r.id) && !!r.sector && mine.has(r.sector)));
    } catch {
      // Chwilowy brak serwera/bazy — spróbujemy przy następnym cyklu.
    }
  }, [announce, city]);

  // Szczęśliwa ścieżka na prezentację: alarm z bazy, a gdy serwer lub baza zawiodą — z danych lokalnych.
  const simulateAlarm = useCallback(async () => {
    // Scenariusz alarmu dzieje się w Krakowie — z innego miasta przechodzimy tam.
    if (city.slug !== SCRIPTED_CITY) {
      router.push(`/centrum?miasto=${SCRIPTED_CITY}&alarm=1`);
      return;
    }
    try {
      // Serwer bez bazy potrafi wisieć — po 3 s przechodzimy na dane lokalne.
      await Promise.race([simulateAlertAction(), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 3000))]);
      await poll();
    } catch {
      announce(localAlertReports(Date.now(), (pos) => sectorOfPoint(pos, city.sectorFeatures)));
    }
  }, [announce, poll, city, router]);

  useEffect(() => {
    const i = setInterval(poll, 4000);
    const onAlarm = () => void simulateAlarm();
    let t: ReturnType<typeof setTimeout> | undefined;
    window.addEventListener("swimm:simulate-alarm", onAlarm);
    // Przyjście z przycisku alarmu na innej stronie: /centrum?alarm=1.
    if (new URLSearchParams(window.location.search).has("alarm")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("alarm");
      window.history.replaceState(null, "", url);
      t = setTimeout(() => void simulateAlarm(), 300);
    }
    return () => {
      clearInterval(i);
      clearTimeout(t);
      window.removeEventListener("swimm:simulate-alarm", onAlarm);
    };
  }, [poll, simulateAlarm]);

  const alert = useMemo(() => pickAlert(scored.filter((r) => alertIds.includes(r.id))), [scored, alertIds]);
  const plans = useMemo(() => {
    const out: Record<string, Plan> = {};
    for (const r of alert?.all ?? [])
      out[r.id] = responsePlan(r, {
        sectorName: (id) => geo.sectorList.find((s) => s.id === id)?.name ?? "",
        cameraName: (id) => cameras.find((c) => c.id === id)?.name ?? id,
        nearbyOpen: scored.filter((x) => x.id !== r.id && x.sector === r.sector && x.status !== "zamkniete").length,
        related: scored
          .filter((x) => x.id !== r.id && x.status !== "zamkniete")
          .map((x) => ({ id: x.id, title: x.title, category: x.category, distanceM: distanceKm(r.position, x.position) * 1000 }))
          .filter((x) => x.distanceM <= 500),
      });
    return out;
  }, [alert, scored, geo, cameras]);

  const selectSector = (id: string | null) => {
    setSelectedSector(id);
    if (!map) return;
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

  const dismissAlert = useCallback(() => setAlertIds([]), []);

  const runStep = (r: ScoredReport, s: Step) => {
    setDoneSteps((d) => new Set(d).add(`${r.id}:${s.id}`));
    if (s.action === "assign" && s.target) updateReport(r.id, { unitId: s.target, status: "przekazane" });
    if (s.action === "camera" && s.target) select({ type: "camera", id: s.target });
    if (s.action === "show") selectSector(s.target ?? null);
    if (s.action === "notify") setToast({ id: r.id, text: `Powiadomiono: ${s.target} · ${r.id}` });
  };

  const updateReport = (id: string, patch: { status?: Status; unitId?: string | null }) => {
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    void updateReportAction(id, patch);
  };

  /** Zapis w bazie; identyfikator i dzielnicę nadaje serwer. */
  const addReport = async (r: Omit<Report, "id" | "createdAt" | "sector" | "status" | "unitId" | "confirmations">) => {
    const saved = await createReportAction({
      title: r.title,
      description: r.description,
      category: r.category,
      source: r.source,
      position: r.position,
      blocking: r.blocking,
      confidence: r.confidence,
      cameraId: r.cameraId,
    });
    knownIds.current.add(saved.id);
    setReports((rs) => [saved, ...rs]);
    setNow(Date.now());
    return saved.id;
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const submitReport = async (d: { title: string; description: string; blocking: boolean }) => {
    if (!draft) return;
    const c = classify(d.description);
    const id = await addReport({
      title: d.title,
      description: d.description,
      category: c.category,
      source: "aplikacja",
      position: draft,
      blocking: d.blocking,
      confidence: c.confidence,
      createdAt: Date.now(),
    });
    setDialog(false);
    setDraft(null);
    setMode("zgloszenia");
    setToast({ id, text: `Przyjęto zgłoszenie ${id} · ${CATEGORY_LABEL[c.category]}` });
    setSelection({ type: "report", id });
  };

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
        others={geo.others}
        onCityClick={switchCity}
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
          <OtherCities map={map} others={others} onCity={switchCity} />
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
              hub={hubFor(city.slug)}
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
        city={city.slug}
        cities={cities}
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
        cameras={cameras}
        onSelect={(id) => select(id ? { type: "report", id } : null)}
        onUpdate={updateReport}
        onNewReport={() => {
          setSelection(null);
          setDialog(true);
          setPicking(true);
        }}
      />
        )}
      </SidePanel>

      <Legend mode={mode} metric={metric} />
      <ZoomControls onZoom={(d) => (d > 0 ? map?.zoomIn() : map?.zoomOut())} />

      {alert && (
        <AlertCenter
          alert={alert}
          plans={plans}
          done={doneSteps}
          onStep={runStep}
          onShow={(r) => {
            setMode("zgloszenia");
            select({ type: "report", id: r.id });
          }}
          onDismiss={dismissAlert}
        />
      )}

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
