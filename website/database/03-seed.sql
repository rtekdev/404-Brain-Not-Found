-- Dane startowe SWIMM dla Krakowa. Lokalizacje i nazwy obiektów prawdziwe, wartości pomiarów i zdarzenia — fikcyjne.
-- Dzielnica pokazowa: D13 Podgórze (awaria sieci wodnej) — zob. docs/SCENARIUSZ_DEMO.md.

-- ───────────── profile zasobów dzielnic (liczba mieszkańców przybliżona, reszta fikcyjna) ─────────────
UPDATE sectors SET pop = 31000, water_loss = 0.09, water_reserve = 0.94, waste_capacity = 0.95, rooftop_pv = 0.3 WHERE id = 'D01';
UPDATE sectors SET pop = 29000, water_loss = 0.08, water_reserve = 0.97, waste_capacity = 1.02, rooftop_pv = 0.6 WHERE id = 'D02';
UPDATE sectors SET pop = 47000, water_loss = 0.07, water_reserve = 0.98, waste_capacity = 1.04, rooftop_pv = 0.8 WHERE id = 'D03';
UPDATE sectors SET pop = 72000, water_loss = 0.08, water_reserve = 0.96, waste_capacity = 1, rooftop_pv = 1.1 WHERE id = 'D04';
UPDATE sectors SET pop = 31000, water_loss = 0.07, water_reserve = 1, waste_capacity = 0.99, rooftop_pv = 0.7 WHERE id = 'D05';
UPDATE sectors SET pop = 23000, water_loss = 0.08, water_reserve = 1.3, waste_capacity = 1.03, rooftop_pv = 1.2 WHERE id = 'D06';
UPDATE sectors SET pop = 21000, water_loss = 0.1, water_reserve = 1.45, waste_capacity = 1.06, rooftop_pv = 1.3 WHERE id = 'D07';
UPDATE sectors SET pop = 64000, water_loss = 0.09, water_reserve = 0.95, waste_capacity = 0.98, rooftop_pv = 1.2 WHERE id = 'D08';
UPDATE sectors SET pop = 17000, water_loss = 0.08, water_reserve = 0.97, waste_capacity = 1, rooftop_pv = 1 WHERE id = 'D09';
UPDATE sectors SET pop = 30000, water_loss = 0.11, water_reserve = 1.25, waste_capacity = 1.05, rooftop_pv = 1.7 WHERE id = 'D10';
UPDATE sectors SET pop = 54000, water_loss = 0.08, water_reserve = 0.98, waste_capacity = 0.97, rooftop_pv = 0.9 WHERE id = 'D11';
UPDATE sectors SET pop = 63000, water_loss = 0.09, water_reserve = 0.96, waste_capacity = 0.8, rooftop_pv = 1 WHERE id = 'D12';
UPDATE sectors SET pop = 37000, water_loss = 0.21, water_reserve = 0.85, waste_capacity = 1.04, rooftop_pv = 0.9 WHERE id = 'D13';
UPDATE sectors SET pop = 30000, water_loss = 0.07, water_reserve = 1.02, waste_capacity = 1.12, rooftop_pv = 1 WHERE id = 'D14';
UPDATE sectors SET pop = 51000, water_loss = 0.07, water_reserve = 0.96, waste_capacity = 1.01, rooftop_pv = 0.8 WHERE id = 'D15';
UPDATE sectors SET pop = 39000, water_loss = 0.08, water_reserve = 0.97, waste_capacity = 1.08, rooftop_pv = 0.7 WHERE id = 'D16';
UPDATE sectors SET pop = 20000, water_loss = 0.1, water_reserve = 1.1, waste_capacity = 1.02, rooftop_pv = 1.8 WHERE id = 'D17';
UPDATE sectors SET pop = 50000, water_loss = 0.09, water_reserve = 1.05, waste_capacity = 1.18, rooftop_pv = 1.4 WHERE id = 'D18';

-- ───────────── kamery ─────────────
INSERT INTO cameras (id, name, longitude, latitude, sector, online, webcam_id) VALUES
  ('K01', 'Rynek Główny', 19.9373, 50.0617, 'D01', true, 'krakow_cam_da9ab3'),
  ('K13', 'Plac Wszystkich Świętych · Urząd Miasta', 19.938, 50.059, 'D01', true, 'krakow_cam_6f3258'),
  ('K14', 'ul. Floriańska', 19.9405, 50.064, 'D01', true, 'krakow_cam_904168'),
  ('K15', 'Wawel · Zamek Królewski', 19.9352, 50.0543, 'D01', true, 'krakow_cam_c78671'),
  ('K16', 'Kazimierz · ul. Szeroka', 19.948, 50.0522, 'D01', true, 'szeroka_cam_7dabea'),
  ('K17', 'Rynek Główny · Sukiennice', 19.9367, 50.0622, 'D01', true, 'krakow_cam_702b61'),
  ('K02', 'Rondo Mogilskie', 19.9592, 50.0662, 'D02', true, NULL),
  ('K03', 'Rondo Ofiar Katynia', 19.889, 50.088, 'D06', true, NULL),
  ('K04', 'Rondo Grunwaldzkie', 19.9365, 50.0478, 'D01', true, NULL),
  ('K05', 'Rondo Matecznego', 19.946, 50.038, 'D13', true, NULL),
  ('K06', 'Al. 29 Listopada / Opolska', 19.956, 50.089, 'D03', true, NULL),
  ('K07', 'Plac Centralny', 20.037, 50.072, 'D18', true, NULL),
  ('K08', 'Rondo Czyżyńskie', 20.01, 50.07, 'D14', true, NULL),
  ('K09', 'Kurdwanów · Wielicka', 19.97, 50.013, 'D11', true, NULL),
  ('K10', 'Ruczaj · Kobierzyńska', 19.915, 50.026, 'D08', true, NULL),
  ('K11', 'Bieżanów · Teligi', 20.02, 50.018, 'D12', false, NULL),
  ('K12', 'Mistrzejowice · Kocmyrzowska', 20.008, 50.096, 'D15', true, NULL),
  ('K18', 'Park przy Tauron Arenie', 19.9941, 50.0683, 'D14', true, NULL);

-- ───────────── zgłoszenia (po 2 na dzielnicę, D13 — 4) ─────────────
INSERT INTO reports
  (id, title, description, category, source, status, longitude, latitude, sector, created_at, unit_id, confirmations, blocking, camera_id, confidence)
VALUES
  ('Z-1024', 'Brak przejścia dla wózków — remont', 'Ogrodzenie remontu zamyka jedyne obniżenie krawężnika przy Plantach.',
   'dostepnosc', 'aplikacja', 'nowe', 19.94, 50.06, 'D01', now() - interval '65 minutes', NULL, 2, true, NULL, 0.80),
  ('Z-1025', 'Nie działa winda na peron', 'Osoby na wózkach nie mogą dostać się na peron 2 dworca Kraków Główny.',
   'dostepnosc', 'aplikacja', 'nowe', 19.9475, 50.0675, 'D01', now() - interval '95 minutes', NULL, 1, true, NULL, 0.86),
  ('Z-1026', 'Awaria sygnalizacji na Rondzie Mogilskim', 'Sygnalizacja miga na żółto na wszystkich wlotach ronda.',
   'drogi', 'kamera', 'w_realizacji', 19.9594, 50.0664, 'D02', now() - interval '70 minutes', 'drogi', 5, false, 'K02', 0.84),
  ('Z-1027', 'Śmieci przy Bulwarze Kurlandzkim', 'Przepełnione kosze, worki leżą na trawniku przy bulwarze.',
   'odpady', 'sms', 'nowe', 19.9664, 50.0587, 'D02', now() - interval '140 minutes', NULL, 1, false, NULL, 0.88),
  ('Z-1028', 'Ciemna ulica na Rakowicach', 'Nie świecą 4 latarnie przy szkole, po zmroku całkiem ciemno.',
   'oswietlenie', 'aplikacja', 'nowe', 19.9764, 50.0754, 'D03', now() - interval '300 minutes', NULL, 2, false, NULL, 0.88),
  ('Z-1029', 'Głęboka dziura w jezdni', 'Ubytek ok. 40 cm na prawym pasie, samochody omijają po przeciwnym pasie.',
   'drogi', 'kamera', 'nowe', 19.9563, 50.0887, 'D03', now() - interval '52 minutes', NULL, 2, false, 'K06', 0.91),
  ('Z-1030', 'Drzewo przewrócone na jezdnię', 'Kamera wykryła powalone drzewo blokujące prawy pas w kierunku centrum.',
   'zielen', 'kamera', 'nowe', 19.8895, 50.0884, 'D04', now() - interval '6 minutes', NULL, 3, true, 'K03', 0.93),
  ('Z-1031', 'Uszkodzony podjazd przy przychodni', 'Pęknięta płyta podjazdu, wózek klinuje się na krawędzi.',
   'dostepnosc', 'telefon', 'przekazane', 19.9205, 50.0953, 'D04', now() - interval '240 minutes', 'dostepnosc', 1, false, NULL, 0.81),
  ('Z-1032', 'Zapadnięty chodnik na Nowej Wsi', 'Zapadlisko przy przejściu dla pieszych, ryzyko potknięcia.',
   'drogi', 'aplikacja', 'nowe', 19.915, 50.072, 'D05', now() - interval '150 minutes', NULL, 1, false, NULL, 0.77),
  ('Z-1033', 'Rozbita wiata przystanku na Łobzowie', 'Szkło na chodniku przy przystanku, ludzie stoją na jezdni.',
   'bezpieczenstwo', 'sms', 'nowe', 19.909, 50.0748, 'D05', now() - interval '45 minutes', NULL, 1, false, NULL, 0.74),
  ('Z-1034', 'Zarośnięty chodnik w Bronowicach Małych', 'Krzewy zasłaniają chodnik, piesi schodzą na jezdnię.',
   'zielen', 'aplikacja', 'nowe', 19.8785, 50.0876, 'D06', now() - interval '230 minutes', NULL, 1, false, NULL, 0.81),
  ('Z-1035', 'Uszkodzony hydrant', 'Hydrant przechylony po uderzeniu samochodu, lekki wyciek.',
   'woda', 'telefon', 'przekazane', 19.88, 50.08, 'D06', now() - interval '200 minutes', 'woda', 1, false, NULL, 0.86),
  ('Z-1036', 'Wymiana lampy zakończona', 'Latarnia przy przystanku naprawiona.',
   'oswietlenie', 'aplikacja', 'zamkniete', 19.89, 50.056, 'D07', now() - interval '900 minutes', 'energia', 1, false, NULL, 0.92),
  ('Z-1037', 'Złamany konar nad ścieżką na Woli Justowskiej', 'Konar wisi nad ścieżką w parku, może spaść.',
   'zielen', 'telefon', 'nowe', 19.87, 50.066, 'D07', now() - interval '110 minutes', NULL, 1, false, NULL, 0.87),
  ('Z-1038', 'Dziura na ścieżce rowerowej na Ruczaju', 'Ubytek nawierzchni na ścieżce wzdłuż Kobierzyńskiej.',
   'drogi', 'kamera', 'nowe', 19.9152, 50.0258, 'D08', now() - interval '85 minutes', NULL, 1, false, 'K10', 0.85),
  ('Z-1039', 'Śmieci obok altany na Osiedlu Podwawelskim', 'Kontenery pełne od weekendu, worki leżą obok altany.',
   'odpady', 'sms', 'nowe', 19.9316, 50.0432, 'D08', now() - interval '260 minutes', NULL, 2, false, NULL, 0.90),
  ('Z-1040', 'Nie świeci oświetlenie przejścia przy Sanktuarium', 'Przejście dla pieszych bez oświetlenia, kierowcy późno widzą pieszych.',
   'oswietlenie', 'telefon', 'nowe', 19.9406, 50.0222, 'D09', now() - interval '190 minutes', NULL, 1, false, NULL, 0.86),
  ('Z-1041', 'Brak podjazdu przy przychodni na Borku', 'Schody bez rampy, osoba na wózku nie wjedzie do przychodni.',
   'dostepnosc', 'aplikacja', 'nowe', 19.9278, 50.0138, 'D09', now() - interval '400 minutes', NULL, 1, false, NULL, 0.80),
  ('Z-1042', 'Nielegalne wysypisko gruzu', 'Gruz i opony porzucone przy drodze leśnej w Swoszowicach.',
   'odpady', 'messenger', 'nowe', 19.945, 49.98, 'D10', now() - interval '420 minutes', NULL, 1, false, NULL, 0.83),
  ('Z-1043', 'Zalana droga w Rajsku', 'Rów nie odbiera wody, droga zalana na długości 50 m.',
   'woda', 'telefon', 'nowe', 19.9702, 49.9867, 'D10', now() - interval '75 minutes', NULL, 1, true, NULL, 0.82),
  ('Z-1044', 'Ciemna ulica na Kurdwanowie', 'Cały odcinek przy szkole bez oświetlenia po zmroku.',
   'oswietlenie', 'aplikacja', 'nowe', 19.965, 50.009, 'D11', now() - interval '300 minutes', NULL, 2, false, NULL, 0.88),
  ('Z-1045', 'Uszkodzona barierka przy przejściu na Woli Duchackiej', 'Barierka oddzielająca chodnik od jezdni leży na ziemi.',
   'bezpieczenstwo', 'sms', 'nowe', 19.9615, 50.0202, 'D11', now() - interval '160 minutes', NULL, 1, false, NULL, 0.76),
  ('Z-1046', 'Przepełnione kontenery na odpady', 'Worki leżą obok altany śmietnikowej na os. Na Kozłówce od dwóch dni.',
   'odpady', 'sms', 'nowe', 20.0165, 50.0205, 'D12', now() - interval '180 minutes', NULL, 3, false, NULL, 0.90),
  ('Z-1047', 'Zerwany kabel oświetlenia na Bieżanowie', 'Kabel latarni zwisa nad chodnikiem przy przystanku.',
   'oswietlenie', 'telefon', 'nowe', 20.0296, 50.014, 'D12', now() - interval '35 minutes', NULL, 1, false, NULL, 0.84),
  ('Z-1048', 'Wyciek wody z jezdni', 'Woda wypływa spod asfaltu na Zabłociu, tworzy się rozlewisko przy przystanku.',
   'woda', 'telefon', 'nowe', 19.964, 50.048, 'D13', now() - interval '38 minutes', NULL, 4, false, NULL, 0.82),
  ('Z-1049', 'Niskie ciśnienie wody w kranach', 'Na Płaszowie od rana ledwo leci woda, w kilku blokach na wyższych piętrach brak wody.',
   'woda', 'sms', 'nowe', 19.9935, 50.0395, 'D13', now() - interval '50 minutes', NULL, 6, false, NULL, 0.86),
  ('Z-1050', 'Mokra plama na chodniku przy Lipowej', 'Chodnik cały czas mokry, mimo że nie padało.',
   'woda', 'aplikacja', 'nowe', 19.9745, 50.0505, 'D13', now() - interval '120 minutes', NULL, 1, false, NULL, 0.72),
  ('Z-1051', 'Kolizja dwóch samochodów', 'Zatrzymane pojazdy na rondzie, tramwaje stoją w obu kierunkach.',
   'bezpieczenstwo', 'kamera', 'przekazane', 19.9463, 50.0383, 'D13', now() - interval '14 minutes', 'kryzys', 2, true, 'K05', 0.88),
  ('Z-1052', 'Zalana ulica po ulewie', 'Woda na całej szerokości jezdni, studzienki nie odbierają wody.',
   'woda', 'kamera', 'nowe', 20.0103, 50.0702, 'D14', now() - interval '21 minutes', NULL, 1, true, 'K08', 0.79),
  ('Z-1053', 'Złamany znak drogowy', 'Znak ustąp pierwszeństwa leży na trawniku.',
   'drogi', 'sms', 'nowe', 20.005, 50.065, 'D14', now() - interval '160 minutes', NULL, 1, false, NULL, 0.85),
  ('Z-1054', 'Złamany konar nad chodnikiem', 'Konar wisi nad chodnikiem przy szkole, może spaść.',
   'zielen', 'telefon', 'nowe', 20.0175, 50.099, 'D15', now() - interval '110 minutes', NULL, 1, false, NULL, 0.87),
  ('Z-1055', 'Zepsuta winda w bloku na Osiedlu Tysiąclecia', 'Mieszkanka na wózku nie może wyjść z mieszkania na 8. piętrze.',
   'dostepnosc', 'aplikacja', 'nowe', 20.0024, 50.0911, 'D15', now() - interval '90 minutes', NULL, 1, true, NULL, 0.83),
  ('Z-1056', 'Dzikie wysypisko przy Zalewie Nowohuckim', 'Meble i worki ze śmieciami porzucone przy alejce nad zalewem.',
   'odpady', 'messenger', 'nowe', 20.048, 50.0828, 'D16', now() - interval '330 minutes', NULL, 1, false, NULL, 0.84),
  ('Z-1057', 'Nie działa sygnalizacja dla pieszych', 'Przycisk na przejściu nie reaguje, zielone się nie zapala.',
   'drogi', 'aplikacja', 'nowe', 20.0152, 50.0822, 'D16', now() - interval '55 minutes', NULL, 1, false, NULL, 0.80),
  ('Z-1058', 'Powalone drzewo na drodze w Grębałowie', 'Drzewo leży w poprzek jezdni po nocnej wichurze.',
   'zielen', 'telefon', 'nowe', 20.075, 50.0971, 'D17', now() - interval '25 minutes', NULL, 1, true, NULL, 0.90),
  ('Z-1059', 'Brak oświetlenia przystanku w Łuczanowicach', 'Przystanek autobusowy całkowicie ciemny po zmroku.',
   'oswietlenie', 'sms', 'nowe', 20.1106, 50.1081, 'D17', now() - interval '280 minutes', NULL, 1, false, NULL, 0.82),
  ('Z-1060', 'Uszkodzona nawierzchnia przy Placu Centralnym', 'Wyrwa w asfalcie przy torowisku, samochody hamują gwałtownie.',
   'drogi', 'kamera', 'nowe', 20.0368, 50.0716, 'D18', now() - interval '40 minutes', NULL, 1, false, 'K07', 0.87),
  ('Z-1061', 'Zalana piwnica w Mogile', 'Woda w piwnicach bloku po awarii rury, mieszkańcy proszą o pomoc.',
   'woda', 'telefon', 'w_realizacji', 20.0627, 50.0621, 'D18', now() - interval '210 minutes', 'woda', 1, false, NULL, 0.85);

-- Kolizja na rondzie Matecznego — przejęta przez numer alarmowy.
UPDATE reports SET handled_by = '112 — Policja' WHERE id = 'Z-1051';

-- ───────────── obiekty z licznikami ─────────────
INSERT INTO assets (id, kind, name, longitude, latitude, sector, unit_id, level, level_label, meters) VALUES
  ('A01', 'zbiornik', 'Zbiorniki wody Kosocice', 19.99, 49.993, 'D10', 'woda', 78, 'napełnienie 78%',
   '[{"metric":"woda","primary":0,"secondary":900}]'::jsonb),
  ('A02', 'przepompownia', 'Zakład Uzdatniania Wody Bielany', 19.842, 50.043, 'D07', 'woda', 92, 'obciążenie 92%',
   '[{"metric":"woda","primary":0,"secondary":1400},{"metric":"energia","primary":0.9,"secondary":0}]'::jsonb),
  ('A03', 'przepompownia', 'Zakład Uzdatniania Wody Rudawa', 19.865, 50.082, 'D06', 'woda', 41, 'obciążenie 41%',
   '[{"metric":"woda","primary":0,"secondary":850},{"metric":"energia","primary":0.5,"secondary":0}]'::jsonb),
  ('A04', 'kontenery', 'Gniazdo os. Na Kozłówce', 20.017, 50.02, 'D12', 'odpady', 97, 'zapełnienie 97%',
   '[{"metric":"odpady","primary":6.1,"secondary":2.8}]'::jsonb),
  ('A05', 'kontenery', 'Gniazdo Mistrzejowice', 20.006, 50.099, 'D15', 'odpady', 55, 'zapełnienie 55%',
   '[{"metric":"odpady","primary":7.4,"secondary":7.2}]'::jsonb),
  ('A06', 'kontenery', 'Gniazdo Kurdwanów', 19.962, 50.011, 'D11', 'odpady', 83, 'zapełnienie 83%',
   '[{"metric":"odpady","primary":5,"secondary":4.2}]'::jsonb),
  ('A07', 'trafostacja', 'Stacja Stare Miasto', 19.942, 50.064, 'D01', 'energia', 64, 'obciążenie 64%',
   '[{"metric":"energia","primary":38,"secondary":0}]'::jsonb),
  ('A08', 'trafostacja', 'Stacja Bieżanów', 20.03, 50.015, 'D12', 'energia', 88, 'obciążenie 88%',
   '[{"metric":"energia","primary":29,"secondary":0}]'::jsonb),
  ('A09', 'ladowarka', 'Ładowarka EV Rondo Mogilskie', 19.96, 50.065, 'D02', 'energia', 50, '2 z 4 stanowisk wolne',
   '[{"metric":"energia","primary":0.15,"secondary":0}]'::jsonb),
  ('A10', 'sprzet', 'Zamiatarka #3', 19.95, 50.055, 'D02', 'drogi', 100, 'dostępna',
   NULL),
  ('A11', 'sprzet', 'Podnośnik koszowy #1', 19.99, 50.08, 'D14', 'zielen', 0, 'w użyciu',
   NULL),
  ('A12', 'fotowoltaika', 'Farma PV Przylasek Rusiecki', 20.13, 50.065, 'D18', 'energia', 71, 'moc chwilowa 71%',
   '[{"metric":"energia","primary":0,"secondary":12}]'::jsonb),
  ('A13', 'fotowoltaika', 'Farma PV Wzgórza Krzesławickie', 20.095, 50.1, 'D17', 'energia', 66, 'moc chwilowa 66%',
   '[{"metric":"energia","primary":0,"secondary":14}]'::jsonb),
  ('A14', 'elektrocieplownia', 'Elektrociepłownia Kraków (Łęg)', 20.02, 50.061, 'D14', 'energia', 74, 'obciążenie 74%',
   '[{"metric":"energia","primary":0,"secondary":180},{"metric":"cieplo","primary":0,"secondary":1300}]'::jsonb),
  ('A15', 'spalarnia', 'Zakład Termicznego Przekształcania Odpadów', 20.08, 50.065, 'D18', 'odpady', 81, 'przepustowość 81%',
   '[{"metric":"energia","primary":0,"secondary":9},{"metric":"cieplo","primary":0,"secondary":120},{"metric":"odpady","primary":0,"secondary":600}]'::jsonb);

-- ───────────── punkty dostępności ─────────────
INSERT INTO access_points (id, kind, name, longitude, latitude, sector, ok) VALUES
  ('P01', 'winda', 'Winda — dworzec Kraków Główny, peron 2', 19.9475, 50.0675, 'D01', false),
  ('P02', 'winda', 'Winda — tunel pod dworcem', 19.944, 50.066, 'D01', true),
  ('P03', 'toaleta', 'Toaleta dostępna — Sukiennice', 19.937, 50.0615, 'D01', true),
  ('P04', 'podjazd', 'Podjazd — Urząd Miasta, pl. Wszystkich Świętych', 19.9385, 50.059, 'D01', true),
  ('P05', 'podjazd', 'Podjazd — przychodnia Prądnik Biały', 19.9205, 50.0953, 'D04', false),
  ('P06', 'przeszkoda', 'Remont — zamknięte obniżenie krawężnika', 19.9403, 50.0602, 'D01', false),
  ('P07', 'toaleta', 'Toaleta dostępna — Park Jordana', 19.916, 50.063, 'D05', true),
  ('P08', 'podjazd', 'Podjazd — Biblioteka Kraków, Rajska', 19.93, 50.063, 'D01', true);
