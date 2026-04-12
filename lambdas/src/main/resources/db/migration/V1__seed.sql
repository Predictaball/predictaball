-- Seed 2026 FIFA World Cup teams and group stage matches
-- 48 teams, 72 group stage matches
-- All datetimes in UTC. Venues truncated to fit varchar(30).
-- match_day = calendar day of tournament (day 1 = June 11)

-- ============================================================
-- TABLES (idempotent, matches Exposed schema)
-- ============================================================
CREATE TABLE IF NOT EXISTS team (
  id SERIAL UNIQUE NOT NULL,
  "name" VARCHAR(30) UNIQUE NOT NULL,
  flag_code VARCHAR(100) NOT NULL,
  ranking INT
);
CREATE TABLE IF NOT EXISTS "match" (
  id SERIAL UNIQUE NOT NULL,
  home_team_id INT NOT NULL REFERENCES team(id),
  away_team_id INT NOT NULL REFERENCES team(id),
  datetime TIMESTAMPTZ NOT NULL,
  home_score INT,
  away_score INT,
  "result" VARCHAR(10),
  "state" VARCHAR(10) NOT NULL,
  venue VARCHAR(30) NOT NULL,
  match_day INT NOT NULL CHECK (match_day >= 1),
  round VARCHAR(20) NOT NULL,
  external_match_id VARCHAR(20)
);

-- ============================================================
-- TEAMS
-- ============================================================
-- flag_code stores ISO 3166-1 alpha-2 code (or subdivision code for England/Scotland)
-- Frontend constructs the full URL, e.g. https://flagcdn.com/w80/{code}.png
INSERT INTO team (name, flag_code, ranking) VALUES
  ('mexico', 'mx', 15),
  ('south africa', 'za', 61),
  ('south korea', 'kr', 22),
  ('czech republic', 'cz', 44),
  ('canada', 'ca', 27),
  ('bosnia and herzegovina', 'ba', 71),
  ('qatar', 'qa', 51),
  ('switzerland', 'ch', 17),
  ('brazil', 'br', 5),
  ('morocco', 'ma', 11),
  ('haiti', 'ht', 84),
  ('scotland', 'gb-sct', 36),
  ('united states', 'us', 14),
  ('paraguay', 'py', 39),
  ('australia', 'au', 26),
  ('turkey', 'tr', 25),
  ('germany', 'de', 9),
  ('curacao', 'cw', 82),
  ('ivory coast', 'ci', 42),
  ('ecuador', 'ec', 23),
  ('netherlands', 'nl', 7),
  ('japan', 'jp', 18),
  ('sweden', 'se', 43),
  ('tunisia', 'tn', 40),
  ('belgium', 'be', 8),
  ('egypt', 'eg', 34),
  ('iran', 'ir', 20),
  ('new zealand', 'nz', 86),
  ('spain', 'es', 1),
  ('cape verde', 'cv', 68),
  ('saudi arabia', 'sa', 60),
  ('uruguay', 'uy', 16),
  ('france', 'fr', 3),
  ('senegal', 'sn', 19),
  ('iraq', 'iq', 58),
  ('norway', 'no', 29),
  ('argentina', 'ar', 2),
  ('algeria', 'dz', 35),
  ('austria', 'at', 24),
  ('jordan', 'jo', 66),
  ('portugal', 'pt', 6),
  ('dr congo', 'cd', 56),
  ('uzbekistan', 'uz', 50),
  ('colombia', 'co', 13),
  ('england', 'gb-eng', 4),
  ('croatia', 'hr', 10),
  ('ghana', 'gh', 72),
  ('panama', 'pa', 30);

-- ============================================================
-- HELPER: use subqueries to resolve team IDs by name
-- ============================================================
-- All matches: state=UPCOMING, round=GROUP_STAGE, no scores

-- ============================================================
-- DAY 1: June 11
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='mexico'), (SELECT id FROM team WHERE name='south africa'),
   '2026-06-11T19:00:00Z', 'Estadio Azteca', 1, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='south korea'), (SELECT id FROM team WHERE name='czech republic'),
   '2026-06-12T02:00:00Z', 'Estadio Akron', 1, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 2: June 12
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='canada'), (SELECT id FROM team WHERE name='bosnia and herzegovina'),
   '2026-06-12T19:00:00Z', 'BMO Field', 2, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='united states'), (SELECT id FROM team WHERE name='paraguay'),
   '2026-06-13T01:00:00Z', 'SoFi Stadium', 2, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 3: June 13
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='qatar'), (SELECT id FROM team WHERE name='switzerland'),
   '2026-06-13T19:00:00Z', 'Levi''s Stadium', 3, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='brazil'), (SELECT id FROM team WHERE name='morocco'),
   '2026-06-13T22:00:00Z', 'MetLife Stadium', 3, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='haiti'), (SELECT id FROM team WHERE name='scotland'),
   '2026-06-14T01:00:00Z', 'Gillette Stadium', 3, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='australia'), (SELECT id FROM team WHERE name='turkey'),
   '2026-06-14T04:00:00Z', 'BC Place', 3, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 4: June 14
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='germany'), (SELECT id FROM team WHERE name='curacao'),
   '2026-06-14T17:00:00Z', 'NRG Stadium', 4, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='netherlands'), (SELECT id FROM team WHERE name='japan'),
   '2026-06-14T20:00:00Z', 'AT&T Stadium', 4, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='ivory coast'), (SELECT id FROM team WHERE name='ecuador'),
   '2026-06-14T23:00:00Z', 'Lincoln Financial Field', 4, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='tunisia'), (SELECT id FROM team WHERE name='sweden'),
   '2026-06-15T02:00:00Z', 'Estadio BBVA', 4, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 5: June 15
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='spain'), (SELECT id FROM team WHERE name='cape verde'),
   '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium', 5, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='belgium'), (SELECT id FROM team WHERE name='egypt'),
   '2026-06-15T19:00:00Z', 'Lumen Field', 5, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='saudi arabia'), (SELECT id FROM team WHERE name='uruguay'),
   '2026-06-15T22:00:00Z', 'Hard Rock Stadium', 5, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='iran'), (SELECT id FROM team WHERE name='new zealand'),
   '2026-06-16T01:00:00Z', 'SoFi Stadium', 5, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 6: June 16
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='france'), (SELECT id FROM team WHERE name='senegal'),
   '2026-06-16T19:00:00Z', 'MetLife Stadium', 6, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='norway'), (SELECT id FROM team WHERE name='iraq'),
   '2026-06-16T22:00:00Z', 'Gillette Stadium', 6, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='argentina'), (SELECT id FROM team WHERE name='algeria'),
   '2026-06-17T01:00:00Z', 'Arrowhead Stadium', 6, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='austria'), (SELECT id FROM team WHERE name='jordan'),
   '2026-06-17T04:00:00Z', 'Levi''s Stadium', 6, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 7: June 17
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='portugal'), (SELECT id FROM team WHERE name='dr congo'),
   '2026-06-17T17:00:00Z', 'NRG Stadium', 7, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='england'), (SELECT id FROM team WHERE name='croatia'),
   '2026-06-17T20:00:00Z', 'AT&T Stadium', 7, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='ghana'), (SELECT id FROM team WHERE name='panama'),
   '2026-06-17T23:00:00Z', 'BMO Field', 7, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='uzbekistan'), (SELECT id FROM team WHERE name='colombia'),
   '2026-06-18T02:00:00Z', 'Estadio Azteca', 7, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 8: June 18
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='czech republic'), (SELECT id FROM team WHERE name='south africa'),
   '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium', 8, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='switzerland'), (SELECT id FROM team WHERE name='bosnia and herzegovina'),
   '2026-06-18T19:00:00Z', 'SoFi Stadium', 8, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='canada'), (SELECT id FROM team WHERE name='qatar'),
   '2026-06-18T22:00:00Z', 'BC Place', 8, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='mexico'), (SELECT id FROM team WHERE name='south korea'),
   '2026-06-19T01:00:00Z', 'Estadio Akron', 8, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 9: June 19
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='united states'), (SELECT id FROM team WHERE name='australia'),
   '2026-06-19T19:00:00Z', 'Lumen Field', 9, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='scotland'), (SELECT id FROM team WHERE name='morocco'),
   '2026-06-19T19:00:00Z', 'Gillette Stadium', 9, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='brazil'), (SELECT id FROM team WHERE name='haiti'),
   '2026-06-20T01:00:00Z', 'Lincoln Financial Field', 9, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='paraguay'), (SELECT id FROM team WHERE name='turkey'),
   '2026-06-20T04:00:00Z', 'Levi''s Stadium', 9, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 10: June 20
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='netherlands'), (SELECT id FROM team WHERE name='sweden'),
   '2026-06-20T17:00:00Z', 'NRG Stadium', 10, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='germany'), (SELECT id FROM team WHERE name='ivory coast'),
   '2026-06-20T20:00:00Z', 'BMO Field', 10, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='ecuador'), (SELECT id FROM team WHERE name='curacao'),
   '2026-06-21T00:00:00Z', 'Arrowhead Stadium', 10, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='tunisia'), (SELECT id FROM team WHERE name='japan'),
   '2026-06-21T04:00:00Z', 'Estadio BBVA', 10, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 11: June 21
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='spain'), (SELECT id FROM team WHERE name='saudi arabia'),
   '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium', 11, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='belgium'), (SELECT id FROM team WHERE name='iran'),
   '2026-06-21T19:00:00Z', 'SoFi Stadium', 11, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='uruguay'), (SELECT id FROM team WHERE name='cape verde'),
   '2026-06-21T22:00:00Z', 'Hard Rock Stadium', 11, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='new zealand'), (SELECT id FROM team WHERE name='egypt'),
   '2026-06-22T01:00:00Z', 'BC Place', 11, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 12: June 22
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='argentina'), (SELECT id FROM team WHERE name='austria'),
   '2026-06-22T17:00:00Z', 'AT&T Stadium', 12, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='france'), (SELECT id FROM team WHERE name='iraq'),
   '2026-06-22T21:00:00Z', 'Lincoln Financial Field', 12, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='norway'), (SELECT id FROM team WHERE name='senegal'),
   '2026-06-23T00:00:00Z', 'MetLife Stadium', 12, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='jordan'), (SELECT id FROM team WHERE name='algeria'),
   '2026-06-23T03:00:00Z', 'Levi''s Stadium', 12, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 13: June 23
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='portugal'), (SELECT id FROM team WHERE name='uzbekistan'),
   '2026-06-23T17:00:00Z', 'NRG Stadium', 13, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='england'), (SELECT id FROM team WHERE name='ghana'),
   '2026-06-23T20:00:00Z', 'Gillette Stadium', 13, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='panama'), (SELECT id FROM team WHERE name='croatia'),
   '2026-06-23T23:00:00Z', 'BMO Field', 13, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='colombia'), (SELECT id FROM team WHERE name='dr congo'),
   '2026-06-24T02:00:00Z', 'Estadio Akron', 13, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 14: June 24 (Group A & B & C matchday 3)
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='canada'), (SELECT id FROM team WHERE name='switzerland'),
   '2026-06-24T19:00:00Z', 'BC Place', 14, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='bosnia and herzegovina'), (SELECT id FROM team WHERE name='qatar'),
   '2026-06-24T19:00:00Z', 'Lumen Field', 14, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='scotland'), (SELECT id FROM team WHERE name='brazil'),
   '2026-06-24T22:00:00Z', 'Hard Rock Stadium', 14, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='morocco'), (SELECT id FROM team WHERE name='haiti'),
   '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium', 14, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='czech republic'), (SELECT id FROM team WHERE name='mexico'),
   '2026-06-25T01:00:00Z', 'Estadio Azteca', 14, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='south africa'), (SELECT id FROM team WHERE name='south korea'),
   '2026-06-25T01:00:00Z', 'Estadio BBVA', 14, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 15: June 25 (Group D & E & F matchday 3)
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='ecuador'), (SELECT id FROM team WHERE name='germany'),
   '2026-06-25T20:00:00Z', 'MetLife Stadium', 15, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='curacao'), (SELECT id FROM team WHERE name='ivory coast'),
   '2026-06-25T20:00:00Z', 'Lincoln Financial Field', 15, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='tunisia'), (SELECT id FROM team WHERE name='netherlands'),
   '2026-06-25T23:00:00Z', 'Arrowhead Stadium', 15, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='japan'), (SELECT id FROM team WHERE name='sweden'),
   '2026-06-25T23:00:00Z', 'AT&T Stadium', 15, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='united states'), (SELECT id FROM team WHERE name='turkey'),
   '2026-06-26T02:00:00Z', 'SoFi Stadium', 15, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='paraguay'), (SELECT id FROM team WHERE name='australia'),
   '2026-06-26T02:00:00Z', 'Levi''s Stadium', 15, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 16: June 26 (Group G & H & I matchday 3)
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='norway'), (SELECT id FROM team WHERE name='france'),
   '2026-06-26T19:00:00Z', 'Gillette Stadium', 16, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='senegal'), (SELECT id FROM team WHERE name='iraq'),
   '2026-06-26T19:00:00Z', 'BMO Field', 16, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='uruguay'), (SELECT id FROM team WHERE name='spain'),
   '2026-06-27T00:00:00Z', 'Estadio Akron', 16, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='cape verde'), (SELECT id FROM team WHERE name='saudi arabia'),
   '2026-06-27T00:00:00Z', 'NRG Stadium', 16, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='new zealand'), (SELECT id FROM team WHERE name='belgium'),
   '2026-06-27T03:00:00Z', 'BC Place', 16, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='egypt'), (SELECT id FROM team WHERE name='iran'),
   '2026-06-27T03:00:00Z', 'Lumen Field', 16, 'GROUP_STAGE', 'UPCOMING');

-- ============================================================
-- DAY 17: June 27 (Group J & K & L matchday 3)
-- ============================================================
INSERT INTO match (home_team_id, away_team_id, datetime, venue, match_day, round, state) VALUES
  ((SELECT id FROM team WHERE name='panama'), (SELECT id FROM team WHERE name='england'),
   '2026-06-27T21:00:00Z', 'MetLife Stadium', 17, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='croatia'), (SELECT id FROM team WHERE name='ghana'),
   '2026-06-27T21:00:00Z', 'Lincoln Financial Field', 17, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='colombia'), (SELECT id FROM team WHERE name='portugal'),
   '2026-06-27T23:30:00Z', 'Hard Rock Stadium', 17, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='dr congo'), (SELECT id FROM team WHERE name='uzbekistan'),
   '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium', 17, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='jordan'), (SELECT id FROM team WHERE name='argentina'),
   '2026-06-28T02:00:00Z', 'AT&T Stadium', 17, 'GROUP_STAGE', 'UPCOMING'),
  ((SELECT id FROM team WHERE name='algeria'), (SELECT id FROM team WHERE name='austria'),
   '2026-06-28T02:00:00Z', 'Arrowhead Stadium', 17, 'GROUP_STAGE', 'UPCOMING');
