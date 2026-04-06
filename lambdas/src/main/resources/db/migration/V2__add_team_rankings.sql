ALTER TABLE team ADD COLUMN IF NOT EXISTS ranking INT;

UPDATE team SET ranking = CASE name
  WHEN 'spain' THEN 1
  WHEN 'argentina' THEN 2
  WHEN 'france' THEN 3
  WHEN 'england' THEN 4
  WHEN 'brazil' THEN 5
  WHEN 'portugal' THEN 6
  WHEN 'netherlands' THEN 7
  WHEN 'belgium' THEN 8
  WHEN 'germany' THEN 9
  WHEN 'croatia' THEN 10
  WHEN 'morocco' THEN 11
  WHEN 'colombia' THEN 13
  WHEN 'united states' THEN 14
  WHEN 'mexico' THEN 15
  WHEN 'uruguay' THEN 16
  WHEN 'switzerland' THEN 17
  WHEN 'japan' THEN 18
  WHEN 'senegal' THEN 19
  WHEN 'iran' THEN 20
  WHEN 'south korea' THEN 22
  WHEN 'ecuador' THEN 23
  WHEN 'austria' THEN 24
  WHEN 'turkey' THEN 25
  WHEN 'australia' THEN 26
  WHEN 'canada' THEN 27
  WHEN 'norway' THEN 29
  WHEN 'panama' THEN 30
  WHEN 'egypt' THEN 34
  WHEN 'algeria' THEN 35
  WHEN 'scotland' THEN 36
  WHEN 'paraguay' THEN 39
  WHEN 'tunisia' THEN 40
  WHEN 'ivory coast' THEN 42
  WHEN 'sweden' THEN 43
  WHEN 'czech republic' THEN 44
  WHEN 'uzbekistan' THEN 50
  WHEN 'qatar' THEN 51
  WHEN 'dr congo' THEN 56
  WHEN 'iraq' THEN 58
  WHEN 'saudi arabia' THEN 60
  WHEN 'south africa' THEN 61
  WHEN 'jordan' THEN 66
  WHEN 'cape verde' THEN 68
  WHEN 'bosnia and herzegovina' THEN 71
  WHEN 'ghana' THEN 72
  WHEN 'curacao' THEN 82
  WHEN 'haiti' THEN 84
  WHEN 'new zealand' THEN 86
END;
