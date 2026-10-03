-- db/init.sql

CREATE TABLE cameras (
  id         VARCHAR(10) PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  sector     VARCHAR(255),
  online     BOOLEAN NOT NULL DEFAULT TRUE,
  webcam_id  VARCHAR(100)          -- player.webcamera.pl/<webcam_id>, NULL = no live feed
);

CREATE TABLE reports (
  id             VARCHAR(10) PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN (
                   'drogi', 'zielen', 'woda', 'odpady',
                   'oswietlenie', 'dostepnosc', 'bezpieczenstwo', 'inne')),
  source         TEXT NOT NULL CHECK (source IN (
                   'kamera', 'telefon', 'sms', 'aplikacja', 'messenger')),
  status         TEXT NOT NULL DEFAULT 'nowe' CHECK (status IN (
                   'nowe', 'przekazane', 'w_realizacji', 'zamkniete')),
  longitude      DOUBLE PRECISION NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  sector         VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unit_id        TEXT,
  confirmations  INTEGER NOT NULL DEFAULT 1,
  blocking       BOOLEAN NOT NULL DEFAULT FALSE,
  camera_id      VARCHAR(10) REFERENCES