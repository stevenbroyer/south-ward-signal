-- Fix team names in sm_fixtures to use official names
-- Updates both home_team_name and away_team_name columns

-- Red Bull New York (from "New York RB")
UPDATE sm_fixtures SET home_team_name = 'Red Bull New York' WHERE home_team_name = 'New York RB';
UPDATE sm_fixtures SET away_team_name = 'Red Bull New York' WHERE away_team_name = 'New York RB';

-- New England Revolution (from "New England")
UPDATE sm_fixtures SET home_team_name = 'New England Revolution' WHERE home_team_name = 'New England';
UPDATE sm_fixtures SET away_team_name = 'New England Revolution' WHERE away_team_name = 'New England';

-- Charlotte FC (from "Charlotte")
UPDATE sm_fixtures SET home_team_name = 'Charlotte FC' WHERE home_team_name = 'Charlotte';
UPDATE sm_fixtures SET away_team_name = 'Charlotte FC' WHERE away_team_name = 'Charlotte';

-- FC Dallas (from "Dallas")
UPDATE sm_fixtures SET home_team_name = 'FC Dallas' WHERE home_team_name = 'Dallas';
UPDATE sm_fixtures SET away_team_name = 'FC Dallas' WHERE away_team_name = 'Dallas';

-- Toronto FC (from "Toronto")
UPDATE sm_fixtures SET home_team_name = 'Toronto FC' WHERE home_team_name = 'Toronto';
UPDATE sm_fixtures SET away_team_name = 'Toronto FC' WHERE away_team_name = 'Toronto';

-- Orlando City SC (from "Orlando City")
UPDATE sm_fixtures SET home_team_name = 'Orlando City SC' WHERE home_team_name = 'Orlando City';
UPDATE sm_fixtures SET away_team_name = 'Orlando City SC' WHERE away_team_name = 'Orlando City';

-- Chicago Fire FC (from "Chicago Fire")
UPDATE sm_fixtures SET home_team_name = 'Chicago Fire FC' WHERE home_team_name = 'Chicago Fire';
UPDATE sm_fixtures SET away_team_name = 'Chicago Fire FC' WHERE away_team_name = 'Chicago Fire';

-- DC United (from "DC United" to "D.C. United")
UPDATE sm_fixtures SET home_team_name = 'D.C. United' WHERE home_team_name = 'DC United';
UPDATE sm_fixtures SET away_team_name = 'D.C. United' WHERE away_team_name = 'DC United';

-- New York City FC (from "New York City")
UPDATE sm_fixtures SET home_team_name = 'New York City FC' WHERE home_team_name = 'New York City';
UPDATE sm_fixtures SET away_team_name = 'New York City FC' WHERE away_team_name = 'New York City';

-- Inter Miami CF (from "Inter Miami")
UPDATE sm_fixtures SET home_team_name = 'Inter Miami CF' WHERE home_team_name = 'Inter Miami';
UPDATE sm_fixtures SET away_team_name = 'Inter Miami CF' WHERE away_team_name = 'Inter Miami';

-- Atlanta United FC (from "Atlanta United")
UPDATE sm_fixtures SET home_team_name = 'Atlanta United FC' WHERE home_team_name = 'Atlanta United';
UPDATE sm_fixtures SET away_team_name = 'Atlanta United FC' WHERE away_team_name = 'Atlanta United';

-- Minnesota United FC (from "Minnesota United")
UPDATE sm_fixtures SET home_team_name = 'Minnesota United FC' WHERE home_team_name = 'Minnesota United';
UPDATE sm_fixtures SET away_team_name = 'Minnesota United FC' WHERE away_team_name = 'Minnesota United';

-- Houston Dynamo FC (from "Houston Dynamo")
UPDATE sm_fixtures SET home_team_name = 'Houston Dynamo FC' WHERE home_team_name = 'Houston Dynamo';
UPDATE sm_fixtures SET away_team_name = 'Houston Dynamo FC' WHERE away_team_name = 'Houston Dynamo';

-- Seattle Sounders FC (from "Seattle Sounders")
UPDATE sm_fixtures SET home_team_name = 'Seattle Sounders FC' WHERE home_team_name = 'Seattle Sounders';
UPDATE sm_fixtures SET away_team_name = 'Seattle Sounders FC' WHERE away_team_name = 'Seattle Sounders';

-- Vancouver Whitecaps FC (from "Vancouver Whitecaps")
UPDATE sm_fixtures SET home_team_name = 'Vancouver Whitecaps FC' WHERE home_team_name = 'Vancouver Whitecaps';
UPDATE sm_fixtures SET away_team_name = 'Vancouver Whitecaps FC' WHERE away_team_name = 'Vancouver Whitecaps';

-- Sporting Kansas City (from "Sporting KC")
UPDATE sm_fixtures SET home_team_name = 'Sporting Kansas City' WHERE home_team_name = 'Sporting KC';
UPDATE sm_fixtures SET away_team_name = 'Sporting Kansas City' WHERE away_team_name = 'Sporting KC';

-- St. Louis City SC (from "St. Louis City")
UPDATE sm_fixtures SET home_team_name = 'St. Louis City SC' WHERE home_team_name = 'St. Louis City';
UPDATE sm_fixtures SET away_team_name = 'St. Louis City SC' WHERE away_team_name = 'St. Louis City';

-- Austin FC (from "Austin")
UPDATE sm_fixtures SET home_team_name = 'Austin FC' WHERE home_team_name = 'Austin';
UPDATE sm_fixtures SET away_team_name = 'Austin FC' WHERE away_team_name = 'Austin';

-- San Diego FC (from "San Diego")
UPDATE sm_fixtures SET home_team_name = 'San Diego FC' WHERE home_team_name = 'San Diego';
UPDATE sm_fixtures SET away_team_name = 'San Diego FC' WHERE away_team_name = 'San Diego';
