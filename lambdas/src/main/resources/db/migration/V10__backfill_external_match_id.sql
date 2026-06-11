-- Backfill external_match_id with football-data.org match IDs.
-- Mappings derived 2026-06-11 from /v4/competitions/2000/matches against the
-- existing 72 group-stage rows; matched on (teams, kickoff date) with a few
-- side-swap and minute-shift tolerances. Knockout rounds get added later.

-- Three rows had stale kickoffs vs the FIFA schedule — correct them so the
-- prediction cutoff (which is purely time-based) doesn't lock too early.
UPDATE match SET datetime = '2026-06-19 22:00:00+00' WHERE id = 30;  -- Scotland vs Morocco
UPDATE match SET datetime = '2026-06-20 00:30:00+00' WHERE id = 31;  -- Brazil vs Haiti
UPDATE match SET datetime = '2026-06-20 03:00:00+00' WHERE id = 32;  -- Paraguay vs Turkey

UPDATE match SET external_match_id = '537327' WHERE id = 1;
UPDATE match SET external_match_id = '537328' WHERE id = 2;
UPDATE match SET external_match_id = '537333' WHERE id = 3;
UPDATE match SET external_match_id = '537345' WHERE id = 4;
UPDATE match SET external_match_id = '537334' WHERE id = 5;
UPDATE match SET external_match_id = '537339' WHERE id = 6;
UPDATE match SET external_match_id = '537340' WHERE id = 7;
UPDATE match SET external_match_id = '537346' WHERE id = 8;
UPDATE match SET external_match_id = '537351' WHERE id = 9;
UPDATE match SET external_match_id = '537357' WHERE id = 10;
UPDATE match SET external_match_id = '537352' WHERE id = 11;
UPDATE match SET external_match_id = '537358' WHERE id = 12;
UPDATE match SET external_match_id = '537369' WHERE id = 13;
UPDATE match SET external_match_id = '537363' WHERE id = 14;
UPDATE match SET external_match_id = '537370' WHERE id = 15;
UPDATE match SET external_match_id = '537364' WHERE id = 16;
UPDATE match SET external_match_id = '537391' WHERE id = 17;
UPDATE match SET external_match_id = '537392' WHERE id = 18;
UPDATE match SET external_match_id = '537397' WHERE id = 19;
UPDATE match SET external_match_id = '537398' WHERE id = 20;
UPDATE match SET external_match_id = '537403' WHERE id = 21;
UPDATE match SET external_match_id = '537409' WHERE id = 22;
UPDATE match SET external_match_id = '537410' WHERE id = 23;
UPDATE match SET external_match_id = '537404' WHERE id = 24;
UPDATE match SET external_match_id = '537329' WHERE id = 25;
UPDATE match SET external_match_id = '537335' WHERE id = 26;
UPDATE match SET external_match_id = '537336' WHERE id = 27;
UPDATE match SET external_match_id = '537330' WHERE id = 28;
UPDATE match SET external_match_id = '537348' WHERE id = 29;
UPDATE match SET external_match_id = '537342' WHERE id = 30;
UPDATE match SET external_match_id = '537341' WHERE id = 31;
UPDATE match SET external_match_id = '537347' WHERE id = 32;
UPDATE match SET external_match_id = '537359' WHERE id = 33;
UPDATE match SET external_match_id = '537353' WHERE id = 34;
UPDATE match SET external_match_id = '537354' WHERE id = 35;
UPDATE match SET external_match_id = '537360' WHERE id = 36;
UPDATE match SET external_match_id = '537371' WHERE id = 37;
UPDATE match SET external_match_id = '537365' WHERE id = 38;
UPDATE match SET external_match_id = '537372' WHERE id = 39;
UPDATE match SET external_match_id = '537366' WHERE id = 40;
UPDATE match SET external_match_id = '537399' WHERE id = 41;
UPDATE match SET external_match_id = '537393' WHERE id = 42;
UPDATE match SET external_match_id = '537394' WHERE id = 43;
UPDATE match SET external_match_id = '537400' WHERE id = 44;
UPDATE match SET external_match_id = '537405' WHERE id = 45;
UPDATE match SET external_match_id = '537411' WHERE id = 46;
UPDATE match SET external_match_id = '537412' WHERE id = 47;
UPDATE match SET external_match_id = '537406' WHERE id = 48;
UPDATE match SET external_match_id = '537337' WHERE id = 49;
UPDATE match SET external_match_id = '537338' WHERE id = 50;
UPDATE match SET external_match_id = '537343' WHERE id = 51;
UPDATE match SET external_match_id = '537344' WHERE id = 52;
UPDATE match SET external_match_id = '537331' WHERE id = 53;
UPDATE match SET external_match_id = '537332' WHERE id = 54;
UPDATE match SET external_match_id = '537355' WHERE id = 55;
UPDATE match SET external_match_id = '537356' WHERE id = 56;
UPDATE match SET external_match_id = '537361' WHERE id = 57;
UPDATE match SET external_match_id = '537362' WHERE id = 58;
UPDATE match SET external_match_id = '537349' WHERE id = 59;
UPDATE match SET external_match_id = '537350' WHERE id = 60;
UPDATE match SET external_match_id = '537395' WHERE id = 61;
UPDATE match SET external_match_id = '537396' WHERE id = 62;
UPDATE match SET external_match_id = '537373' WHERE id = 63;
UPDATE match SET external_match_id = '537374' WHERE id = 64;
UPDATE match SET external_match_id = '537367' WHERE id = 65;
UPDATE match SET external_match_id = '537368' WHERE id = 66;
UPDATE match SET external_match_id = '537413' WHERE id = 67;
UPDATE match SET external_match_id = '537414' WHERE id = 68;
UPDATE match SET external_match_id = '537407' WHERE id = 69;
UPDATE match SET external_match_id = '537408' WHERE id = 70;
UPDATE match SET external_match_id = '537401' WHERE id = 71;
UPDATE match SET external_match_id = '537402' WHERE id = 72;
