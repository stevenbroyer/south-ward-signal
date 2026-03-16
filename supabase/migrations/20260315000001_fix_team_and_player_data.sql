-- Fix team names in sm_teams to use official MLS names
UPDATE sm_teams SET name = 'Red Bull New York' WHERE id = 383;
UPDATE sm_teams SET name = 'Charlotte FC' WHERE id = 260119;
UPDATE sm_teams SET name = 'FC Dallas' WHERE id = 583;
UPDATE sm_teams SET name = 'Inter Miami CF' WHERE id = 239235;
UPDATE sm_teams SET name = 'New England Revolution' WHERE id = 641;
UPDATE sm_teams SET name = 'New York City FC' WHERE id = 3627;
UPDATE sm_teams SET name = 'FC Cincinnati' WHERE id = 3636;
UPDATE sm_teams SET name = 'Orlando City SC' WHERE id = 204;
UPDATE sm_teams SET name = 'Sporting Kansas City' WHERE id = 323;
UPDATE sm_teams SET name = 'Seattle Sounders FC' WHERE id = 2649;
UPDATE sm_teams SET name = 'St. Louis CITY SC' WHERE id = 267299;
UPDATE sm_teams SET name = 'Toronto FC' WHERE id = 111;
UPDATE sm_teams SET name = 'Houston Dynamo FC' WHERE id = 478;
UPDATE sm_teams SET name = 'Minnesota United FC' WHERE id = 3639;
UPDATE sm_teams SET name = 'Atlanta United FC' WHERE id = 3645;
UPDATE sm_teams SET name = 'Austin FC' WHERE id = 254172;
UPDATE sm_teams SET name = 'San Diego FC' WHERE id = 275650;
UPDATE sm_teams SET name = 'San Jose Earthquakes' WHERE id = 287;
UPDATE sm_teams SET name = 'Chicago Fire FC' WHERE id = 75;
UPDATE sm_teams SET name = 'Columbus Crew' WHERE id = 577;
UPDATE sm_teams SET name = 'D.C. United' WHERE id = 193;
UPDATE sm_teams SET name = 'Nashville SC' WHERE id = 148048;
UPDATE sm_teams SET name = 'Portland Timbers' WHERE id = 607;
UPDATE sm_teams SET name = 'Vancouver Whitecaps FC' WHERE id = 292;

-- Also fix team names in sm_standings so the league table displays correctly
UPDATE sm_standings SET team_name = 'Red Bull New York' WHERE team_id = 383;
UPDATE sm_standings SET team_name = 'Charlotte FC' WHERE team_id = 260119;
UPDATE sm_standings SET team_name = 'FC Dallas' WHERE team_id = 583;
UPDATE sm_standings SET team_name = 'Inter Miami CF' WHERE team_id = 239235;
UPDATE sm_standings SET team_name = 'New England Revolution' WHERE team_id = 641;
UPDATE sm_standings SET team_name = 'New York City FC' WHERE team_id = 3627;
UPDATE sm_standings SET team_name = 'FC Cincinnati' WHERE team_id = 3636;
UPDATE sm_standings SET team_name = 'Orlando City SC' WHERE team_id = 204;
UPDATE sm_standings SET team_name = 'Sporting Kansas City' WHERE team_id = 323;
UPDATE sm_standings SET team_name = 'Seattle Sounders FC' WHERE team_id = 2649;
UPDATE sm_standings SET team_name = 'St. Louis CITY SC' WHERE team_id = 267299;
UPDATE sm_standings SET team_name = 'Toronto FC' WHERE team_id = 111;
UPDATE sm_standings SET team_name = 'Houston Dynamo FC' WHERE team_id = 478;
UPDATE sm_standings SET team_name = 'Minnesota United FC' WHERE team_id = 3639;
UPDATE sm_standings SET team_name = 'Atlanta United FC' WHERE team_id = 3645;
UPDATE sm_standings SET team_name = 'Austin FC' WHERE team_id = 254172;
UPDATE sm_standings SET team_name = 'San Diego FC' WHERE team_id = 275650;
UPDATE sm_standings SET team_name = 'San Jose Earthquakes' WHERE team_id = 287;
UPDATE sm_standings SET team_name = 'Chicago Fire FC' WHERE team_id = 75;
UPDATE sm_standings SET team_name = 'Columbus Crew' WHERE team_id = 577;
UPDATE sm_standings SET team_name = 'D.C. United' WHERE team_id = 193;
UPDATE sm_standings SET team_name = 'Nashville SC' WHERE team_id = 148048;
UPDATE sm_standings SET team_name = 'Portland Timbers' WHERE team_id = 607;
UPDATE sm_standings SET team_name = 'Vancouver Whitecaps FC' WHERE team_id = 292;

-- Fix RBNY player names (abbreviated → full names)
UPDATE sm_players SET name = 'Roald Mitchell', common_name = 'Roald Mitchell' WHERE id = 37525720;
UPDATE sm_players SET name = 'Omar Valencia', common_name = 'Omar Valencia' WHERE id = 37634467;
UPDATE sm_players SET name = 'Justin Che', common_name = 'Justin Che' WHERE id = 37526520;
UPDATE sm_players SET name = 'Tim Parker', common_name = 'Tim Parker' WHERE id = 262175;
UPDATE sm_players SET name = 'Mohammed Sofo', common_name = 'Mohammed Sofo' WHERE id = 37699619;

-- Fix RBNY player positions
UPDATE sm_players SET position = 'Forward' WHERE id = 37695917;   -- Julian Hall: Midfielder → Forward
UPDATE sm_players SET position = 'Midfielder' WHERE id = 37525720; -- Roald Mitchell: Defender → Midfielder
UPDATE sm_players SET position = 'Midfielder' WHERE id = 191491;  -- Gustav Berggren: Defender → Midfielder
UPDATE sm_players SET position = 'Defender' WHERE id = 262175;    -- Tim Parker: Midfielder → Defender
UPDATE sm_players SET position = 'Forward' WHERE id = 37605590;   -- Juan Mina: Midfielder → Forward
UPDATE sm_players SET position = 'Midfielder' WHERE id = 32586;   -- Emil Forsberg: Forward → Midfielder
UPDATE sm_players SET position = 'Forward' WHERE id = 37569338;   -- Rafael Mosquera: Midfielder → Forward
UPDATE sm_players SET position = 'Forward' WHERE id = 37693964;   -- Tanner Rosborough: Midfielder → Forward
UPDATE sm_players SET position = 'Forward' WHERE id = 37655938;   -- Andy Rojas: Midfielder → Forward
UPDATE sm_players SET position = 'Forward' WHERE id = 31229026;   -- Cade Cowell: Midfielder → Forward
