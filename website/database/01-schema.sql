-- Schemat bazy SWIMM. Pliki z tego katalogu wczytuje Postgres przy pierwszym starcie
-- (docker-entrypoint-initdb.d, kolejność alfabetyczna): 01 schemat, 02 miasto (OSM), 03 dane startowe.

CREATE SEQUENCE report_id_seq START 1062;

CREATE TABLE city (
  slug      VARCHAR(50) PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  boundary  JSONB NOT NULL               -- GeoJSON Polygon | MultiPolygon
);

-- Sektory = dzielnice. Geometria z OSM (02-city.sql), profil zasobów z danych startowych (03-seed.sql).
CREATE TABLE sectors (
  id              VARCHAR(10) PRIMARY KEY,
  city_slug       VARCHAR(50) NOT NULL REFERENCES city(slug) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  area_km2        REAL NOT NULL,
  anchor_lon      DOUBLE PRECISION NOT NULL,
  anchor_lat      DOUBLE PRECISION NOT NULL,
  geometry        JSONB NOT NULL,        -- GeoJSON Polygon | MultiPolygon
  pop             INTEGER NOT NULL DEFAULT 10000,
  water_loss      REAL NOT NULL DEFAULT 0.1  CHECK (water_loss BETWEEN 0 AND 0.9),
  water_reserve   REAL NOT NULL DEFAULT 1    CHECK (water_reserve > 0),
  waste_capacity  REAL NOT NULL DEFAULT 1    CHECK (waste_capacity > 0),
  rooftop_pv      REAL NOT NULL DEFAULT 1    CHECK (rooftop_pv >= 0)
);

CREATE TABLE places (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  sector     VARCHAR(10) REFERENCES sectors(id) ON DELETE SET NULL
);

CREATE TABLE cameras (
  id         VARCHAR(10) PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  sector     VARCHAR(10) REFERENCES sectors(id) ON DELETE SET NULL,
  online     BOOLEAN NOT NULL DEFAULT TRUE,
  webcam_id  VARCHAR(100)                -- player.webcamera.pl/<webcam_id>, NULL = brak obrazu na żywo
);

CREATE TABLE reports (
  id             VARCHAR(10) PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN (
                   'drogi', 'zielen', 'woda', 'odpady',
                   'oswietlenie', 'dostepnosc', 'bezpieczenstwo', 'inne')),
  source         TEXT NOT NULL CHECK (source IN (
                   'kamera', 'telefon', 'sms', 'aplikacja', 'messenger', 'telegram')),
  status         TEXT NOT NULL DEFAULT 'nowe' CHECK (status IN (
                   'nowe', 'przekazane', 'w_realizacji', 'zamkniete')),
  longitude      DOUBLE PRECISION,
  latitude       DOUBLE PRECISION,
  sector         VARCHAR(10) REFERENCES sectors(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unit_id        TEXT,
  confirmations  INTEGER NOT NULL DEFAULT 1,
  blocking       BOOLEAN NOT NULL DEFAULT FALSE,
  camera_id      VARCHAR(10) REFERENCES cameras(id) ON DELETE SET NULL,
  confidence     REAL NOT NULL DEFAULT 0.7 CHECK (confidence BETWEEN 0 AND 1),
  handled_by     TEXT                    -- kto przejął poza urzędem, np. '112 — CPR Kraków'
);

CREATE TABLE assets (
  id           VARCHAR(10) PRIMARY KEY,
  kind         TEXT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  sector       VARCHAR(10) REFERENCES sectors(id) ON DELETE SET NULL,
  unit_id      TEXT NOT NULL,
  level        INTEGER NOT NULL CHECK (level BETWEEN 0 AND 100),
  level_label  TEXT NOT NULL,
  meters       JSONB                     -- [{ "metric", "primary", "secondary" }], NULL = brak liczników
);

CREATE TABLE access_points (
  id         VARCHAR(10) PRIMARY KEY,
  kind       TEXT NOT NULL,
  name       VARCHAR(255) NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  sector     VARCHAR(10) REFERENCES sectors(id) ON DELETE SET NULL,
  ok         BOOLEAN NOT NULL
);

CREATE INDEX reports_created_at_idx ON reports (created_at DESC);
CREATE INDEX reports_status_idx ON reports (status);
CREATE INDEX reports_sector_idx ON reports (sector);

-- Trigger for notifying frontend on new report insert to db
CREATE OR REPLACE FUNCTION notify_new_report() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_report', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_notify
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION notify_new_report();