-- One-off top-up: every user gets +1 of each chip for the knockout stage,
-- matching the promise made in the knockout-explainer onboarding flow.
-- Flyway runs this exactly once per environment so we can't double-grant.
UPDATE member
SET double_points_chips = double_points_chips + 1,
    one_out_chips = one_out_chips + 1,
    crowd_chips = crowd_chips + 1;
