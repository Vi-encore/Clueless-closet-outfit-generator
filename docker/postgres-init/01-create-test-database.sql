-- A second database for the tests that need one, so a test run never truncates
-- the wardrobe you have been filling by hand.
--
-- This file runs only on a freshly created volume. If you add something here
-- later, it will not run against an existing database: either apply it by hand
-- or recreate the volume with `docker compose down -v`, which deletes the data.
CREATE DATABASE closet_test;
