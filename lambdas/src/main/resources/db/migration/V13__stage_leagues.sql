-- Two new global leagues, "Group Stage" and "Knockout", which (like "Global")
-- every member belongs to. Their leaderboards are filtered to points earned
-- on matches in that stage (see calculateStageLeaderboard).

INSERT INTO league (id, name, kind) VALUES ('group-stage', 'Group Stage', 'GLOBAL');
INSERT INTO league (id, name, kind) VALUES ('knockout', 'Knockout', 'GLOBAL');

INSERT INTO league_membership (member_id, league_id)
SELECT id, 'group-stage' FROM member;

INSERT INTO league_membership (member_id, league_id)
SELECT id, 'knockout' FROM member;
