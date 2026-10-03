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
  camera_id      VARCHAR(10) REFERENCES cameras(id) ON DELETE SET NULL,
  confidence     REAL NOT NULL DEFAULT 0.7 CHECK (confidence BETWEEN 0 AND 1)
);

CREATE TABLE assets (
  id           VARCHAR(10) PRIMARY KEY,
  kind         TEXT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  latitude     DOUBLE PRECISION NOT NULL,
  sector       VARCHAR(255),
  unit_id      TEXT NOT NULL,
  level        INTEGER NOT NULL CHECK (level BETWEEN 0 AND 100),
  level_label  TEXT NOT NULL,
  meters       JSONB            -- [{ "metric", "primary", "secondary" }], NULL if none
);

CREATE TABLE access_points (
  id         VARCHAR(10) PRIMARY KEY,
  kind       TEXT NOT NULL,
  name       VARCHAR(255) NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  sector     VARCHAR(255),
  ok         BOOLEAN NOT NULL
);

CREATE INDEX reports_created_at_idx ON reports (created_at DESC);
CREATE INDEX reports_status_idx ON reports (status);

-- ───────────── cameras ─────────────
INSERT INTO cameras (id, name, longitude, latitude, online, webcam_id) VALUES
  ('K01', 'Rynek Główny', 19.9373, 50.0617, true, 'krakow_cam_da9ab3'),
  ('K13', 'Plac Wszystkich Świętych · Urząd Miasta', 19.9380, 50.0590, true, 'krakow_cam_6f3258'),
  ('K14', 'ul. Floriańska', 19.9405, 50.0640, true, 'krakow_cam_904168'),
  ('K15', 'Wawel · Zamek Królewski', 19.9352, 50.0543, true, 'krakow_cam_c78671'),
  ('K16', 'Kazimierz · ul. Szeroka', 19.9480, 50.0522, true, 'szeroka_cam_7dabea'),
  ('K17', 'Rynek Główny · Sukiennice', 19.9367, 50.0622, true, 'krakow_cam_702b61'),
  ('K02', 'Rondo Mogilskie', 19.9592, 50.0662, true, NULL),
  ('K03', 'Rondo Ofiar Katynia', 19.8890, 50.0880, true, NULL),
  ('K04', 'Rondo Grunwaldzkie', 19.9365, 50.0478, true, NULL),
  ('K05', 'Rondo Matecznego', 19.9460, 50.0380, true, NULL),
  ('K06', 'Al. 29 Listopada / Opolska', 19.9560, 50.0890, true, NULL),
  ('K07', 'Plac Centralny', 20.0370, 50.0720, true, NULL),
  ('K08', 'Rondo Czyżyńskie', 20.0100, 50.0700, true, NULL),
  ('K09', 'Kurdwanów · Wielicka', 19.9700, 50.0130, true, NULL),
  ('K10', 'Ruczaj · Kobierzyńska', 19.9150, 50.0260, true, NULL),
  ('K11', 'Bieżanów · Teligi', 20.0200, 50.0180, false, NULL),
  ('K12', 'Mistrzejowice · Kocmyrzowska', 20.0080, 50.0960, true, NULL);

-- ───────────── reports ─────────────
-- created_at = now() - "ago" minutes; ids = Z-(1024 + index in SEEDS)
INSERT INTO reports
  (id, title, description, category, source, status, longitude, latitude, created_at, unit_id, confirmations, blocking, camera_id, confidence)
VALUES
  -- D01 Stare Miasto
  ('Z-1024', 'Brak przejścia dla wózków — remont', 'Ogrodzenie remontu zamyka jedyne obniżenie krawężnika przy Plantach.',
   'dostepnosc', 'aplikacja', 'nowe', 19.9400, 50.0600, now() - interval '65 minutes', NULL, 2, true, NULL, 0.80),
  ('Z-1025', 'Nie działa winda na peron', 'Osoby na wózkach nie mogą dostać się na peron 2 dworca Kraków Główny.',
   'dostepnosc', 'aplikacja', 'nowe', 19.9475, 50.0675, now() - interval '95 minutes', NULL, 1, true, NULL, 0.86),
  -- D02 Grzegórzki
  ('Z-1026', 'Awaria sygnalizacji na Rondzie Mogilskim', 'Sygnalizacja miga na żółto na wszystkich wlotach ronda.',
   'drogi', 'kamera', 'w_realizacji', 19.9594, 50.0664, now() - interval '70 minutes', 'drogi', 5, false, 'K02', 0.84),
  ('Z-1027', 'Śmieci przy Bulwarze Kurlandzkim', 'Przepełnione kosze, worki leżą na trawniku przy bulwarze.',
   'odpady', 'sms', 'nowe', 19.9664, 50.0587, now() - interval '140 minutes', NULL, 1, false, NULL, 0.88),
  -- D03 Prądnik Czerwony
  ('Z-1028', 'Ciemna ulica na Rakowicach', 'Nie świecą 4 latarnie przy szkole, po zmroku całkiem ciemno.',
   'oswietlenie', 'aplikacja', 'nowe', 19.9764, 50.0754, now() - interval '300 minutes', NULL, 2, false, NULL, 0.88),
  ('Z-1029', 'Głęboka dziura w jezdni', 'Ubytek ok. 40 cm na prawym pasie, samochody omijają po przeciwnym pasie.',
   'drogi', 'kamera', 'nowe', 19.9563, 50.0887, now() - interval '52 minutes', NULL, 2, false, 'K06', 0.91),
  -- D04 Prądnik Biały
  ('Z-1030', 'Drzewo przewrócone na jezdnię', 'Kamera wykryła powalone drzewo blokujące prawy pas w kierunku centrum.',
   'zielen', 'kamera', 'nowe', 19.8895, 50.0884, now() - interval '6 minutes', NULL, 3, true, 'K03', 0.93),
  ('Z-1031', 'Uszkodzony podjazd przy przychodni', 'Pęknięta płyta podjazdu, wózek klinuje się na krawędzi.',
   'dostepnosc', 'telefon', 'przekazane', 19.9205, 50.0953, now() - interval '240 minutes', NULL, 1, false, NULL, 0.81),
  -- D05 Krowodrza
  ('Z-1032', 'Zapadnięty chodnik na Nowej Wsi', 'Zapadlisko przy przejściu dla pieszych, ryzyko potknięcia.',
   'drogi', 'aplikacja', 'nowe', 19.9150, 50.0720, now() - interval '150 minutes', NULL, 1, false, NULL, 0.77),
  ('Z-1033', 'Rozbita wiata przystanku na Łobzowie', 'Szkło na chodniku przy przystanku, ludzie stoją na jezdni.',
   'bezpieczenstwo', 'sms', 'nowe', 19.9090, 50.0748, now() - interval '45 minutes', NULL, 1, false, NULL, 0.74),
  -- D06 Bronowice
  ('Z-1034', 'Zarośnięty chodnik w Bronowicach Małych', 'Krzewy zasłaniają chodnik, piesi schodzą na jezdnię.',
   'zielen', 'aplikacja', 'nowe', 19.8785, 50.0876, now() - interval '230 minutes', NULL, 1, false, NULL, 0.81),
  ('Z-1035', 'Uszkodzony hydrant', 'Hydrant przechylony po uderzeniu samochodu, lekki wyciek.',
   'woda', 'telefon', 'przekazane', 19.8800, 50.0800, now() - interval '200 minutes', 'woda', 1, false, NULL, 0.86),
  -- D07 Zwierzyniec
  ('Z-1036', 'Wymiana lampy zakończona', 'Latarnia przy przystanku naprawiona.',
   'oswietlenie', 'aplikacja', 'zamkniete', 19.8900, 50.0560, now() - interval '900 minutes', 'energia', 1, false, NULL, 0.92),
  ('Z-1037', 'Złamany konar nad ścieżką na Woli Justowskiej', 'Konar wisi nad ścieżką w parku, może spaść.',
   'zielen', 'telefon', 'nowe', 19.8700, 50.0660, now() - interval '110 minutes', NULL, 1, false, NULL, 0.87),
  -- D08 Dębniki
  ('Z-1038', 'Dziura na ścieżce rowerowej na Ruczaju', 'Ubytek nawierzchni na ścieżce wzdłuż Kobierzyńskiej.',
   'drogi', 'kamera', 'nowe', 19.9152, 50.0258, now() - interval '85 minutes', NULL, 1, false, 'K10', 0.85),
  ('Z-1039', 'Śmieci obok altany na Osiedlu Podwawelskim', 'Kontenery pełne od weekendu, worki leżą obok altany.',
   'odpady', 'sms', 'nowe', 19.9316, 50.0432, now() - interval '260 minutes', NULL, 2, false, NULL, 0.90),
  -- D09 Łagiewniki-Borek Fałęcki
  ('Z-1040', 'Nie świeci oświetlenie przejścia przy Sanktuarium', 'Przejście dla pieszych bez oświetlenia, kierowcy późno widzą pieszych.',
   'oswietlenie', 'telefon', 'nowe', 19.9406, 50.0222, now() - interval '190 minutes', NULL, 1, false, NULL, 0.86),
  ('Z-1041', 'Brak podjazdu przy przychodni na Borku', 'Schody bez rampy, osoba na wózku nie wjedzie do przychodni.',
   'dostepnosc', 'aplikacja', 'nowe', 19.9278, 50.0138, now() - interval '400 minutes', NULL, 1, false, NULL, 0.80),
  -- D10 Swoszowice
  ('Z-1042', 'Nielegalne wysypisko gruzu', 'Gruz i opony porzucone przy drodze leśnej w Swoszowicach.',
   'odpady', 'messenger', 'nowe', 19.9450, 49.9800, now() - interval '420 minutes', NULL, 1, false, NULL, 0.83),
  ('Z-1043', 'Zalana droga w Rajsku', 'Rów nie odbiera wody, droga zalana na długości 50 m.',
   'woda', 'telefon', 'nowe', 19.9702, 49.9867, now() - interval '75 minutes', NULL, 1, true, NULL, 0.82),
  -- D11 Podgórze Duchackie
  ('Z-1044', 'Ciemna ulica na Kurdwanowie', 'Cały odcinek przy szkole bez oświetlenia po zmroku.',
   'oswietlenie', 'aplikacja', 'nowe', 19.9650, 50.0090, now() - interval '300 minutes', NULL, 2, false, NULL, 0.88),
  ('Z-1045', 'Uszkodzona barierka przy przejściu na Woli Duchackiej', 'Barierka oddzielająca chodnik od jezdni leży na ziemi.',
   'bezpieczenstwo', 'sms', 'nowe', 19.9615, 50.0202, now() - interval '160 minutes', NULL, 1, false, NULL, 0.76),
  -- D12 Bieżanów-Prokocim
  ('Z-1046', 'Przepełnione kontenery na odpady', 'Worki leżą obok altany śmietnikowej na os. Na Kozłówce od dwóch dni.',
   'odpady', 'sms', 'nowe', 20.0165, 50.0205, now() - interval '180 minutes', NULL, 3, false, NULL, 0.90),
  ('Z-1047', 'Zerwany kabel oświetlenia na Bieżanowie', 'Kabel latarni zwisa nad chodnikiem przy przystanku.',
   'oswietlenie', 'telefon', 'nowe', 20.0296, 50.0140, now() - interval '35 minutes', NULL, 1, false, NULL, 0.84),
  -- D13 Podgórze (dzielnica pokazowa: awaria sieci wodnej)
  ('Z-1048', 'Wyciek wody z jezdni', 'Woda wypływa spod asfaltu na Zabłociu, tworzy się rozlewisko przy przystanku.',
   'woda', 'telefon', 'nowe', 19.9640, 50.0480, now() - interval '38 minutes', NULL, 4, false, NULL, 0.82),
  ('Z-1049', 'Niskie ciśnienie wody w kranach', 'Na Płaszowie od rana ledwo leci woda, w kilku blokach na wyższych piętrach brak wody.',
   'woda', 'sms', 'nowe', 19.9935, 50.0395, now() - interval '50 minutes', NULL, 6, false, NULL, 0.86),
  ('Z-1050', 'Mokra plama na chodniku przy Lipowej', 'Chodnik cały czas mokry, mimo że nie padało.',
   'woda', 'aplikacja', 'nowe', 19.9745, 50.0505, now() - interval '120 minutes', NULL, 1, false, NULL, 0.72),
  ('Z-1051', 'Kolizja dwóch samochodów', 'Zatrzymane pojazdy na rondzie, tramwaje stoją w obu kierunkach.',
   'bezpieczenstwo', 'kamera', 'przekazane', 19.9463, 50.0383, now() - interval '14 minutes', NULL, 2, true, 'K05', 0.88),
  -- D14 Czyżyny
  ('Z-1052', 'Zalana ulica po ulewie', 'Woda na całej szerokości jezdni, studzienki nie odbierają wody.',
   'woda', 'kamera', 'nowe', 20.0103, 50.0702, now() - interval '21 minutes', NULL, 1, true, 'K08', 0.79),
  ('Z-1053', 'Złamany znak drogowy', 'Znak ustąp pierwszeństwa leży na trawniku.',
   'drogi', 'sms', 'nowe', 20.0050, 50.0650, now() - interval '160 minutes', NULL, 1, false, NULL, 0.85),
  -- D15 Mistrzejowice
  ('Z-1054', 'Złamany konar nad chodnikiem', 'Konar wisi nad chodnikiem przy szkole, może spaść.',
   'zielen', 'telefon', 'nowe', 20.0175, 50.0990, now() - interval '110 minutes', NULL, 1, false, NULL, 0.87),
  ('Z-1055', 'Zepsuta winda w bloku na Osiedlu Tysiąclecia', 'Mieszkanka na wózku nie może wyjść z mieszkania na 8. piętrze.',
   'dostepnosc', 'aplikacja', 'nowe', 20.0024, 50.0911, now() - interval '90 minutes', NULL, 1, true, NULL, 0.83),
  -- D16 Bieńczyce
  ('Z-1056', 'Dzikie wysypisko przy Zalewie Nowohuckim', 'Meble i worki ze śmieciami porzucone przy alejce nad zalewem.',
   'odpady', 'messenger', 'nowe', 20.0480, 50.0828, now() - interval '330 minutes', NULL, 1, false, NULL, 0.84),
  ('Z-1057', 'Nie działa sygnalizacja dla pieszych', 'Przycisk na przejściu nie reaguje, zielone się nie zapala.',
   'drogi', 'aplikacja', 'nowe', 20.0152, 50.0822, now() - interval '55 minutes', NULL, 1, false, NULL, 0.80),
  -- D17 Wzgórza Krzesławickie
  ('Z-1058', 'Powalone drzewo na drodze w Grębałowie', 'Drzewo leży w poprzek jezdni po nocnej wichurze.',
   'zielen', 'telefon', 'nowe', 20.0750, 50.0971, now() - interval '25 minutes', NULL, 1, true, NULL, 0.90),
  ('Z-1059', 'Brak oświetlenia przystanku w Łuczanowicach', 'Przystanek autobusowy całkowicie ciemny po zmroku.',
   'oswietlenie', 'sms', 'nowe', 20.1106, 50.1081, now() - interval '280 minutes', NULL, 1, false, NULL, 0.82),
  -- D18 Nowa Huta
  ('Z-1060', 'Uszkodzona nawierzchnia przy Placu Centralnym', 'Wyrwa w asfalcie przy torowisku, samochody hamują gwałtownie.',
   'drogi', 'kamera', 'nowe', 20.0368, 50.0716, now() - interval '40 minutes', NULL, 1, false, 'K07', 0.87),
  ('Z-1061', 'Zalana piwnica w Mogile', 'Woda w piwnicach bloku po awarii rury, mieszkańcy proszą o pomoc.',
   'woda', 'telefon', 'w_realizacji', 20.0627, 50.0621, now() - interval '210 minutes', 'woda', 1, false, NULL, 0.85);

-- ───────────── assets ─────────────
INSERT INTO assets (id, kind, name, longitude, latitude, unit_id, level, level_label, meters) VALUES
  ('A01', 'zbiornik', 'Zbiorniki wody Kosocice', 19.9900, 49.9930, 'woda', 78, 'napełnienie 78%',
   '[{"metric":"woda","primary":0,"secondary":900}]'),
  ('A02', 'przepompownia', 'Zakład Uzdatniania Wody Bielany', 19.8420, 50.0430, 'woda', 92, 'obciążenie 92%',
   '[{"metric":"woda","primary":0,"secondary":1400},{"metric":"energia","primary":0.9,"secondary":0}]'),
  ('A03', 'przepompownia', 'Zakład Uzdatniania Wody Rudawa', 19.8650, 50.0820, 'woda', 41, 'obciążenie 41%',
   '[{"metric":"woda","primary":0,"secondary":850},{"metric":"energia","primary":0.5,"secondary":0}]'),
  ('A04', 'kontenery', 'Gniazdo os. Na Kozłówce', 20.0170, 50.0200, 'odpady', 97, 'zapełnienie 97%',
   '[{"metric":"odpady","primary":6.1,"secondary":2.8}]'),
  ('A05', 'kontenery', 'Gniazdo Mistrzejowice', 20.0060, 50.0990, 'odpady', 55, 'zapełnienie 55%',
   '[{"metric":"odpady","primary":7.4,"secondary":7.2}]'),
  ('A06', 'kontenery', 'Gniazdo Kurdwanów', 19.9620, 50.0110, 'odpady', 83, 'zapełnienie 83%',
   '[{"metric":"odpady","primary":5.0,"secondary":4.2}]'),
  ('A07', 'trafostacja', 'Stacja Stare Miasto', 19.9420, 50.0640, 'energia', 64, 'obciążenie 64%',
   '[{"metric":"energia","primary":38,"secondary":0}]'),
  ('A08', 'trafostacja', 'Stacja Bieżanów', 20.0300, 50.0150, 'energia', 88, 'obciążenie 88%',
   '[{"metric":"energia","primary":29,"secondary":0}]'),
  ('A09', 'ladowarka', 'Ładowarka EV Rondo Mogilskie', 19.9600, 50.0650, 'energia', 50, '2 z 4 stanowisk wolne',
   '[{"metric":"energia","primary":0.15,"secondary":0}]'),
  ('A10', 'sprzet', 'Zamiatarka #3', 19.9500, 50.0550, 'drogi', 100, 'dostępna', NULL),
  ('A11', 'sprzet', 'Podnośnik koszowy #1', 19.9900, 50.0800, 'zielen', 0, 'w użyciu', NULL),
  ('A12', 'fotowoltaika', 'Farma PV Przylasek Rusiecki', 20.1300, 50.0650, 'energia', 71, 'moc chwilowa 71%',
   '[{"metric":"energia","primary":0,"secondary":12}]'),
  ('A13', 'fotowoltaika', 'Farma PV Wzgórza Krzesławickie', 20.0950, 50.1000, 'energia', 66, 'moc chwilowa 66%',
   '[{"metric":"energia","primary":0,"secondary":14}]'),
  ('A14', 'elektrocieplownia', 'Elektrociepłownia Kraków (Łęg)', 20.0200, 50.0610, 'energia', 74, 'obciążenie 74%',
   '[{"metric":"energia","primary":0,"secondary":180},{"metric":"cieplo","primary":0,"secondary":1300}]'),
  ('A15', 'spalarnia', 'Zakład Termicznego Przekształcania Odpadów', 20.0800, 50.0650, 'odpady', 81, 'przepustowość 81%',
   '[{"metric":"energia","primary":0,"secondary":9},{"metric":"cieplo","primary":0,"secondary":120},{"metric":"odpady","primary":0,"secondary":600}]');

-- ───────────── access_points ─────────────
INSERT INTO access_points (id, kind, name, longitude, latitude, ok) VALUES
  ('P01', 'winda', 'Winda — dworzec Kraków Główny, peron 2', 19.9475, 50.0675, false),
  ('P02', 'winda', 'Winda — tunel pod dworcem', 19.9440, 50.0660, true),
  ('P03', 'toaleta', 'Toaleta dostępna — Sukiennice', 19.9370, 50.0615, true),
  ('P04', 'podjazd', 'Podjazd — Urząd Miasta, pl. Wszystkich Świętych', 19.9385, 50.0590, true),
  ('P05', 'podjazd', 'Podjazd — przychodnia Prądnik Biały', 19.9205, 50.0953, false),
  ('P06', 'przeszkoda', 'Remont — zamknięte obniżenie krawężnika', 19.9403, 50.0602, false),
  ('P07', 'toaleta', 'Toaleta dostępna — Park Jordana', 19.9160, 50.0630, true),
  ('P08', 'podjazd', 'Podjazd — Biblioteka Kraków, Rajska', 19.9300, 50.0630, true);