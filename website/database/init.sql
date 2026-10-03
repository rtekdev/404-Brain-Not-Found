CREATE TYPE report_priority AS ENUM ('high', 'medium', 'low');

CREATE TABLE reports (
  id        SERIAL PRIMARY KEY,
  title     VARCHAR(255) NOT NULL,
  location  VARCHAR(255) NOT NULL,
  priority  report_priority NOT NULL DEFAULT 'medium',
  metadata  JSONB NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO reports (title, location, priority, metadata) VALUES
  ('Q1 Sales', 'Krakow', 'high', '{"author": "Anna", "tags": ["sales", "q1"]}'),
  ('Inspection A', 'Warsaw', 'medium', '{"author": "Piotr"}'),
  ('Annual Review', 'Gdansk', 'low', '{}');