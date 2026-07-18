# Fourth Quarter Sports Coverage Map

Last updated: 2026-07-13

## North Star

The Scores and Sports areas should eventually feel like a universal sports switchboard: every major fan base can find its sport, but the app still stays quick, readable, and mobile-first. We should expand in tiers based on real data availability, not by showing empty or fake leagues.

## Coverage Tiers

### Tier 1: Core Scoreboard Now

These should feel first-class in Scores, Home, Gamecast, Standings, Search, and Team/Sport pages.

- Pro basketball: NBA, WNBA.
- College basketball: NCAA men's, NCAA women's.
- Football: NFL, NCAA football.
- Baseball/softball: MLB first; NCAA baseball and NCAA softball next.
- Hockey: NHL first; NCAA men's and women's hockey next.
- Soccer: MLS, NWSL, Premier League, Champions League, Europa League, Conference League, La Liga, Bundesliga, Serie A, Ligue 1, FIFA World Cup, Euros, Copa America, NCAA men's soccer, NCAA women's soccer.
- Golf: PGA Tour, LPGA, LIV, majors.
- Tennis: ATP, WTA, Grand Slams.
- Combat: UFC, Boxing; PFL and Bellator when feed support is stable.
- Motorsports: F1, NASCAR, IndyCar.

### Tier 2: Fan Demand Expansion

These should get Sport pages and score/event surfaces once we have trustworthy schedules, standings, rankings, or event data.

- College championship belt: NCAA cross country, indoor track and field, outdoor track and field, swimming and diving, gymnastics, wrestling, volleyball, beach volleyball, rowing, tennis, golf, field hockey, water polo, fencing, bowling, rifle, skiing, acrobatics and tumbling, STUNT, and every men's/women's version where the sport has separate seasons or championships.
- Lacrosse: PLL, NLL, NCAA men's, NCAA women's, World Lacrosse, Olympic lacrosse sixes.
- Rugby: rugby union, rugby league, sevens, Six Nations, Rugby World Cup, MLR.
- Cricket: ICC events, T20 leagues, The Ashes, men's/women's national teams, Olympic T20.
- Volleyball: NCAA men's, NCAA women's, pro indoor, beach volleyball, Olympic volleyball.
- Track and field: NCAA indoor/outdoor, NCAA cross country, Diamond League, World Championships, Olympic trials, Olympics.
- Swimming and diving: NCAA men's/women's, World Aquatics, Olympic trials, Olympics.
- Gymnastics: NCAA men's/women's, World Championships, Olympics.
- Cycling: Tour de France, Giro, Vuelta, UCI worlds, Olympic cycling.
- Soccer tournament ladder: FIFA World Cup, Women's World Cup, Club World Cup, U-20, U-17, Olympic soccer, World Cup qualifiers, Gold Cup, Nations League, AFCON, Asian Cup, Copa America, Euros, Champions League finals.
- Horse racing: Triple Crown, Breeders' Cup.
- Para/adaptive sports: Paralympics, Special Olympics, wheelchair basketball, wheelchair rugby, wheelchair tennis, Para athletics, Para swimming, Para ice hockey, sitting volleyball, goalball, boccia, blind football, Para cycling, Para climbing, adaptive surfing.
- Esports: only with a clear league/event model and no fake live stats.
- Action sports: X Games, skateboarding, snowboarding, surfing, sport climbing, BMX.

### Tier 3: Olympic And Seasonal Event Hub

These can live inside seasonal hubs when the calendar makes them relevant.

- Summer Olympic sports: aquatics, archery, athletics, badminton, basketball, boxing, breaking as Paris-era archive, canoeing, cycling, equestrian, fencing, field hockey, football/soccer, golf, gymnastics, handball, judo, modern pentathlon, rowing, rugby sevens, sailing, shooting, skateboarding, sport climbing, surfing, table tennis, taekwondo, tennis, triathlon, volleyball, weightlifting, wrestling.
- LA 2028 additions/returns: baseball/softball, cricket, flag football, lacrosse, squash.
- Winter Olympic sports/disciplines: alpine skiing, biathlon, bobsleigh, cross-country skiing, curling, figure skating, freestyle skiing, ice hockey, luge, Nordic combined, short track, skeleton, ski jumping, ski mountaineering, snowboard, speed skating.
- Paralympic hub: LA28 Paralympic sports, Winter Paralympic sports, classification context, medal tables, athlete stories, and adaptive sport explainers.

### Tier 4: Sports Culture And Event Moments

These are not always "scores," but they absolutely matter to sports fans and should be part of the app's calendar, news, creator, and Fan Pulse logic.

- Draft nights: NFL, NBA, WNBA, MLB, NHL, MLS SuperDraft, NWSL draft/recruiting equivalents when active, plus lottery nights and combine/pro day windows.
- College calendar moments: National Signing Day, Early Signing Day, transfer portal windows, bowl selection, March Madness Selection Sunday, College Football Playoff rankings, conference realignment, media days, rivalry week, conference championship week, Frozen Four, College World Series, Women's College World Series.
- Trade and roster deadlines: NBA trade deadline, MLB trade deadline, NHL trade deadline, NFL cutdown day, waiver periods, free agency openers, arbitration windows.
- All-star and showcase weeks: NBA/WNBA All-Star, MLB All-Star, NHL All-Star/4 Nations style events, NFL Pro Bowl Games, McDonald's All-American, Nike Hoop Summit, Senior Bowl, Shrine Bowl.
- Major spectacle events: Super Bowl week, WrestleMania-level sports entertainment if treated as entertainment, UFC numbered cards, boxing super fights, outdoor NHL games, MLB Field of Dreams/London Series, NFL international games, F1 street race weekends, one-off confirmed events like UFC Freedom 250 at the White House.
- Awards and rankings: Heisman, Ballon d'Or, MVP/Cy Young/rookie races, college award nights, Hall of Fame classes, AP/Coaches/CFP rankings, FIFA rankings, tennis rankings, golf world rankings.
- Fandom/community events: watch parties, tailgates, supporter sections, creator live rooms, fantasy draft rooms, bracket pools, fan travel guides, rivalry explainers, chant/culture primers.

## Scoreboard Archetypes

- Team clock sports: basketball, football, soccer, hockey, lacrosse, rugby, handball, volleyball, water polo, field hockey.
- Inning/period sequence sports: baseball, softball, cricket.
- Set/match sports: tennis, volleyball, badminton, table tennis, squash, pickleball, padel.
- Race/event sports: F1, NASCAR, IndyCar, athletics, swimming, cycling, rowing, skiing, skating.
- Leaderboard sports: golf, diving, gymnastics, surfing, sport climbing, skateboarding.
- Fight/card sports: MMA, boxing, wrestling, judo, taekwondo.
- Bracket/tournament sports: March Madness, World Cup, cricket tournaments, tennis majors, Olympic knockout rounds.

## Product Rules

- Scores filters should show first-class leagues the app can actually fetch or meaningfully route to.
- Sports pages can list broader sports with "coming soon" or seasonal states, but should not imply fake live coverage.
- Gamecast should use sport-specific templates, not one generic scoreboard for everything.
- Fan Pulse prompts should attach to a real game, real team, real article, or clearly labeled local preview.
- Home should surface a user's teams first, then the best live/next/final moments across their preferred sports.
- Event hubs should be source-gated: confirmed date, trusted source, event status, and clear label if it is preview, rumor, scheduled, live, final, postponed, canceled, or archived.
- The app should separate "score coverage" from "sports culture coverage" so a fan can still follow draft nights, signing days, awards, rankings, and spectacle events even when there is no live score.
- College and para/adaptive sports should not be buried as novelty categories; if we cover them, they get respectful sport-specific surfaces and real context.

## Product Surface Implications

- Home: "What matters now" should pull from live games, your teams, major event calendar, draft/signing days, and big community moments.
- Scores: default to live score coverage, with an event rail for non-score moments when relevant.
- Sports: each sport needs tabs for Scores, News, Standings/Rankings, Events, Teams/Athletes, Creators, and Explainers where applicable.
- Gamecast: match the sport archetype first, then add social layers, projection reads, and creator analysis.
- Fan Pulse: prompts can be game-based, roster-based, draft-based, ranking-based, or event-based, but each one needs context so "what are you buying?" is obvious.
- Creator area: support recurring shows by sport, team, league, event, and fan community, not just generic creator cards.

## Sources Checked

- Olympic sports overview: https://en.wikipedia.org/wiki/Olympic_sports
- LA 2028 added sports reporting: https://apnews.com/article/olympics-los-angeles-2028-new-sports-fec19fce19288053f27044a285894486
- Milano Cortina 2026 winter sports summary: https://www.theguardian.com/sport/2026/feb/05/winter-olympics-2026-milano-cortina-italy-schedule-events-opening-ceremony
- Paralympic sports overview: https://www.paralympic.org/sports
- NCAA championship sports reference: https://www.ncaa.com/championships
- UFC Freedom 250 White House event context: https://apnews.com/article/1a88cc3a171ce7a2697880bb3ca1e91c
