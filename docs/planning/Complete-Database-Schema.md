# Complete F1 Database Schema: Comprehensive Data Entity Framework for Formula 1 Racing Systems

Your F1 API/database can be dramatically expanded beyond the core entities you have. Research into Ergast, OpenF1, official F1 timing APIs, and modern telemetry systems reveals **over 50 distinct data entities** organized into 11 major categories. This comprehensive guide covers everything from historical championship data (1950+) to real-time telemetry sampled at 3.7 Hz.

## Core entities: The foundation

Beyond your existing structure, these core entities need enrichment:

**Drivers** should include permanent race numbers (2014+), three-letter codes (HAM, VER), date of birth, nationality, headshot URLs, Wikipedia links, broadcast names, and Super License tracking. **Teams/Constructors** require ownership structure, factory locations, commercial vs. official names, team colors (hex codes), corporate hierarchy, and partnership tracking. **Circuits** need multiple layout variants, coordinate systems for mapping, elevation profiles, corner classifications (slow/medium/fast), surface specifications, grade ratings (all F1 circuits are Grade 1), and historical layout changes with dates. **Seasons** should track regulatory eras, points system versions, and calendar structures. **Races** must distinguish between standard Grand Prix weekends and sprint format weekends, storing separate timing for all sessions (FP1/2/3, qualifying, sprint qualifying, sprint race, main race).

## Race weekend data: Capturing every session

**Session types** form a critical entity covering Practice 1/2/3, Qualifying (Q1/Q2/Q3), Sprint Shootout (SQ1/SQ2/SQ3), Sprint Race, and Grand Prix. Each session requires start/end timestamps, session status tracking (started/finished/finalized), track status throughout, and GMT offset information.

**Qualifying results** need historically-aware format tracking. From 1950-1995 it was multi-session traditional format. The 1996-2002 era used single Saturday sessions. The disastrous 2003-2004 single-lap qualifying required race fuel loads. The 2005 aggregate format combined two sessions. From 2006-2009, the three-part knockout included fuel considerations. The modern 2010+ format uses Q1 (18 min), Q2 (15 min), Q3 (12 min) with the 107% rule applied in Q1. Store Q1/Q2/Q3 times separately, track eliminated drivers at each stage, and record the actual format used per event.

**Race results** require classification status (Finished, DNF, DNS, DSQ, NC), position text handling ("+1 LAP", "R", "D"), DNF reason codes (50+ specific types from accident/collision to electrical/hydraulics/gearbox failures), laps completed, finishing time or gap to winner, fastest lap data, and status tracking. The **status table** should enumerate all finishing statuses: Finished, +N Laps, Accident, Collision, Engine, Gearbox, Transmission, Clutch, Hydraulics, Electrical, Disqualified, Spun off, and many specific mechanical failures.

**Sprint results** mirror race result structure but with different points allocation: 8-7-6-5-4-3-2-1 for top 8 (changed from 3-2-1 in 2021). Track which qualifying session set the sprint grid versus which set the race grid.

## Performance data: Granular timing and telemetry

**Lap times** available from 1996 onwards require lap number, lap time in both text format ("1:43.762") and milliseconds, position at lap end, session time when completed, track status during lap (green/yellow/SC/VSC/red), and deleted lap flags with deletion reasons (track limits).

**Sector times** divide each lap into three sectors, storing individual sector durations, session times at sector completion, intermediate speeds (I1, I2, Speed Trap, Finish Line), and color indicators (yellow/green/purple for slower/personal best/fastest overall).

**Mini-sectors** provide granular analysis with 8 segments per sector (24 total per lap). Values include: 0 (unavailable), 2048 (yellow - slower than personal best), 2049 (green - personal best), 2051 (purple - fastest overall), 2064 (pit lane). These enable detailed corner-by-corner performance comparison but are not available during races, only practice and qualifying.

**Pit stops** tracked comprehensively from 2011 onwards need pit in/out times (session timestamps), stationary duration in milliseconds, lap number when occurred, stop number (1st, 2nd, 3rd), tire compound change details, work performed (front wing changes, penalties served), and position changes. The fastest pit stop record is **McLaren's 1.80 seconds** (2023 Qatar GP).

**Real-time telemetry** sampled at approximately 3.7 Hz (every 270ms) includes speed (km/h), throttle position (0-100%), brake pressure (0-100), DRS status (multiple states: 0/1 off, 8 detected, 10/12/14 on), gear position (0=neutral, 1-8), engine RPM, and timestamps. This data powers modern viewing applications and analysis tools.

**Position tracking** provides X/Y/Z coordinates at 3.7 Hz, enabling track mapping and real-time position visualization. The coordinate system origin is arbitrary per circuit but consistent within each track. Distance metrics include cumulative distance driven, relative distance on track (0-1 scale), and differential distance between samples.

**Intervals and gaps** updated every 4 seconds during races show gap to leader (time or "+N LAP" if lapped), interval to car ahead, interval to car behind, and real-time position changes throughout sessions.

## Technical data: Regulations, components, and compliance

**Car specifications** require extensive tracking across multiple eras. Current regulations (2025) mandate minimum mass 800kg (car + driver, reducing to 770kg in 2026), maximum width 2000mm (1900mm in 2026), maximum height 950mm, and maximum wheelbase 3600mm.

**Aerodynamic components** each have defined reference volumes: Front Wing (profiles with up to 4 sections, endplates, diveplanes, adjustable flap angles), Rear Wing (2-section profiles, pylons, beam, endplates), Floor (including up to 4 fences per side, edge wing, bib), Plank Assembly (10mm thickness, 9mm minimum wear, skids max 24,000mm²), and bodywork groups (nose, forward chassis, mid chassis, sidepod, coke panel, engine cover, tail). Track coordinate systems (XA/XB/XC reference planes, XF/XR wheel axle positions, legality ride height specifications) and scrutineering datum points.

**Power unit components** operate under strict allocation rules. For 2025: 4 ICE (Internal Combustion Engine: 1.6L turbo V6, minimum 145kg, 750-850bhp), 4 Turbochargers, 4 MGU-K (Motor Generator Unit-Kinetic: ~160bhp, becoming 350kW in 2026), 4 MGU-H (eliminated in 2026), 2 Energy Stores, 2 Control Electronics, and 8 of each exhaust element. Track component pools, usage dates, penalties for exceeding allocation, and seal numbers. The rev limit is 15,000 RPM with 110kg maximum fuel per race.

**Gearbox regulations** require 8 forward gears + 1 reverse, with each gearbox lasting 5 consecutive race weekends (P3, Qualifying, Race count as one event). A 5-place grid penalty applies for unscheduled changes. Track the pool of 5 gearboxes per driver per season and Restricted Number Components (gearbox case/cassette, driveline, gear change components).

**Power unit suppliers and partnerships** change annually: Mercedes supplies Mercedes, McLaren, Williams, Aston Martin (until 2026); Ferrari supplies Ferrari, Haas, Kick Sauber (2025), Cadillac (2026+); Honda RBPT supplies Red Bull Racing and RB (2025); Renault supplies Alpine (2025). Major 2026 changes include Red Bull Ford Powertrains, Honda to Aston Martin, Audi factory team, and Cadillac entry with Ferrari engines through 2028 before GM power units in 2029.

**Tire specifications** across Pirelli's C0-C6 compound range (C6 ultra-soft new for 2025) with distinct allocations: Standard weekends receive 13 dry sets (2 Hard/3 Medium/8 Soft), 4 Intermediate, 3 Full Wet. Sprint weekends get 12 dry sets (2 Hard/4 Medium/6 Soft), 5 Intermediate, 2 Full Wet. Track compound selection announcements, set usage per session, age/laps per set, degradation rates, performance windows, mandatory 2-compound rule in dry races, and stint analysis.

## Penalty system: Complete infringement tracking

**Time penalties** include 5-second, 10-second (served during pit stop or added), 20-second added (drive-through not served in final 5 laps), 30-second added (stop-go not served), drive-through (pit within 2 laps, no work allowed), and stop-and-go (5s or 10s stationary, pit within 2 laps).

**Grid penalties** follow complex rules: first ICE/TC/MGU-K/MGU-H beyond allocation incurs 10-place penalty, additional components 5-place each. Accumulated grid penalties use specific ordering: penalties ≤15 places applied to qualifying position, penalties >15 places result in back-of-grid start. Multiple penalized drivers ordered by qualifying position, then by which team notified FIA first.

**License penalty points** accumulate on FIA Super Licenses with 12 points in 12 months triggering automatic 1-race ban. Track date issued, infringement type, steward decision reference, and expiry dates.

**Reprimands** allow 4 per season; the 5th triggers 10-place grid penalty. Track sporting vs. technical reprimands separately.

**Other penalties** include black flag (disqualification), black & white flag (unsportsmanship warning), black & orange circle flag (mechanical problem, must pit), fines (€5,000 base, adjustable), suspensions, pit lane starts, and championship exclusions (rare).

**Steward decisions** require documentation of incident number, timestamp, drivers/teams involved, investigation type (noted/under investigation/no further action/penalty applied), evidence reviewed, ruling issued, reasoning provided, and right of review status.

## Personnel data: Team structures and roles

**Executive leadership** includes Team Principal (overall operations, strategy, driver management), CEO (often combined role), Sporting Director (racing operations, weekend management), and Technical Director (car development, factory/track split decisions).

**Engineering departments** at top teams comprise 11+ specialist groups: Chief Engineer (trackside oversight), Head of Engineering (factory-based design), Performance Engineers (driver-specific optimization), Race Engineers (primary driver interface), Strategy Team (race strategy, pit timing, tire management), Data Analysts (telemetry analysis, track-to-factory relay), Aerodynamics (CFD, wind tunnel, design), Simulation Team (driver-in-loop, strategy modeling), Test & Reserve Drivers (simulator work, substitutes), Design Office (concept, CAD modeling), Materials Department (composite design, manufacturing), and Quality & Reliability (component testing, failure analysis).

**Trackside operations** bring approximately 75 people to each race. **Mechanics** organize into car-specific teams covering chassis, gearbox, brakes, and power unit. **Pit crew roles** include precise position assignments: Jack Operators (front & rear, 2 people), Wheel Gunners (4), Tire Carriers (8 - front/rear, inside/outside per wheel), Lollipop Man/Light System Operator, and Pit Wall Personnel. **Support staff** handle logistics coordination, hospitality, PR/communications, and race strategy execution.

**Factory personnel** at top teams number 1000+ covering manufacturing, CFD engineers, wind tunnel operators, composite technicians, machine shop workers, quality control, and parts manufacturing.

**Steward personnel** consist of four stewards per race (including one driver steward with recent F1 experience), Race Director (Rui Marques as of 2024), and Permanent Advisor (Herbie Blash). Track individual steward assignments across seasons to identify consistency patterns.

## Historical records: Championship context and milestones

**Points system evolution** fundamentally affects historical comparisons. Track exact configurations by era: 1950-1959 (8-6-4-3-2 top 5 + 1 fastest lap), 1960 (8-6-4-3-2-1 top 6 + 1 fastest lap), 1961-1990 (9-6-4-3-2-1 top 6 with best-N results rules), 1991-2002 (10-6-4-3-2-1 all results count), 2003-2009 (10-8-6-5-4-3-2-1 top 8), 2010-2018 (25-18-15-12-10-8-6-4-2-1 top 10, with 2014 double points experiment), 2019-2024 (current + fastest lap point if top 10 and ≥50% distance), 2025+ (fastest lap point removed). Sprint points: 2021 (3-2-1), 2022+ (8-7-6-5-4-3-2-1).

**Driver milestones** to track include age records (youngest start: Max Verstappen 17y 166d; youngest win: Max 18y 228d), career statistics (starts: Fernando Alonso 350+; wins: Lewis Hamilton 105, Michael Schumacher 91; poles: Hamilton 100+; championships: Hamilton & Schumacher 7 each), consecutive achievements (Max's 10 consecutive wins in 2023, 19 total season wins), and specialized accomplishments.

**Grand Slam/Grand Chelem** achievement (pole position + leading every lap + fastest lap + race win) has occurred only 69 times by 27 drivers. Jim Clark holds the record with 8 grand slams, and only 3 drivers achieved consecutive grand slams. This rare achievement requires dedicated tracking separate from regular wins.

**Constructor records** include most championships (Ferrari 16), most wins (Ferrari 240+), consecutive wins (Red Bull 15 in 2023, breaking McLaren's 1988 record of 11), fastest pit stop (McLaren 1.80s, 2023 Qatar), and team evolution tracking (name changes, ownership transfers, mergers/acquisitions, entries/withdrawals).

**Qualifying format changes** require historical format tracking: traditional multi-session (1950-1995), single Saturday session (1996-2002), single-lap qualifying (2003-2004), aggregate qualifying (2005), three-part with fuel (2006-2009), three-part no fuel (2010-2015), failed elimination experiment (2016, 2 races only), current knockout (2016+), and sprint weekend variations.

**Special historical situations** include shared drives (1950-1957, points divided equally), Indianapolis 500 inclusion (1950-1960, drivers only not constructors), Formula 2 cars in F1 races (1952-1953), best-N results rules (until 1990), and Super License lapses requiring 300km re-qualification if away >3 years.

## Weather conditions: Environmental tracking

**Real-time weather data** updated every 60 seconds includes air temperature (°C), track temperature (°C), humidity (%), atmospheric pressure (mbar), rainfall indicator/intensity, wind speed (m/s), and wind direction (0-359°). Historical weather summaries need wet/dry session classification, extreme conditions flags, and heat hazard declarations (adds 4kg to minimum mass).

Track surface conditions separately: dry, damp, wet, and intermediate states affect tire choice mandates and DRS availability.

## Championship standings: Dynamic tracking

**Driver standings** require snapshots after each race showing cumulative points, championship position, wins to date, poles to date, podiums to date, fastest laps to date, and position changes from previous race. Calculate potential championship scenarios in later races.

**Constructor standings** track cumulative points, position, wins, and aggregate statistics from both drivers. Remember that historically (until 1979) only the highest-scoring driver per constructor counted for team points, fundamentally changing championship dynamics.

## Race control and safety: Flags, incidents, and communications

**Race control messages** provide official communications with category (Flag, CarEvent, DRS, SafetyCar, Drs, Other), message text, timestamp, lap number, driver number (if applicable), scope (Track, Driver, Sector), sector affected, and flag type.

**Flag signals** require comprehensive tracking: Green (track clear), Yellow single (danger, no overtaking), Yellow double (major danger, prepare to stop), Red (session stopped), Blue (faster car approaching - **3 ignored warnings = penalty**), White (slow vehicle), Black (disqualification), Black & White diagonal (unsporting warning), Black & Orange circle (mechanical issue, must pit), Yellow/Red stripes (slippery surface), and Chequered (session end). Track location (marshal post, sector), duration displayed, affected drivers, and compliance.

**Safety Car deployments** need full tracking: deployment trigger (incident type, location), lap numbers (deployed, in, out), lapped car unlapping procedures (all must unlap since 2022 rule change), pit lane status (open/closed), restart procedures, and Safety Car line positions (SC1, SC2).

**Virtual Safety Car** introduced in 2015 requires tracking of deployment trigger, lap numbers, delta time enforcement (30% speed reduction), sector compliance, advantages to specific drivers/teams, pit entry occurrences, and end procedures (10-15 second warning before restart).

**DRS zones** vary by circuit with 1-4 activation zones per track. Track detection point locations (where 1-second gap measured), activation zone start/end coordinates, straight length requirements (>3 seconds), availability rules (not available first lap in 2024+, disabled under yellow/SC/VSC/wet conditions, available at will in practice/qualifying), and speed benefit (~10-12 km/h).

## Advanced modern data: Real-time streaming

**Team radio** captures communications between drivers and race engineers with timestamp, driver number, recording URL (MP3 format hosted on livetiming.formula1.com), and AI-generated transcripts (available in some apps but not 100% reliable). These provide strategic insights and entertainment value.

**Telemetry streams** at 3.7 Hz from F1's official livetiming.formula1.com API include CarData.z (compressed telemetry), Position.z (compressed location), TimingData, TimingAppData, TrackStatus, SessionStatus, RaceControlMessages, LapCount, DriverList, WeatherData, TeamRadio, SessionInfo, ArchiveStatus, and TyreStintSeries. The SignalR WebSocket protocol streams messages with unique ever-increasing message identifiers and document keys for entity updates.

**Live timing displays** in modern apps like MultiViewer show position tracking on circuit maps with marshal sectors, battle graphs (time delta visualization between drivers), under investigation flags, fastest lap indicators, tire information displays (compound, age, used tire indicator with line through icon), DRS status, in-car telemetry overlays (speed, throttle, brake, gear, RPM), and mini-sector color coding.

## Additional specialized entities

**Starting grid** requires pre-race grid formation with penalties applied, 2-by-2 staggered formation details, pole position side (varies by circuit - left or right side of track), pit lane start positions, and penalty ordering for multiple penalized drivers.

**Formation lap procedures** track starting grid positions, position maintenance rules (only overtake if car ahead has obvious problem), pit entry for mechanical issues, aborted start procedures, and additional formation lap rules.

**Race start systems** use 5 pairs of red lights (10 total) in 2 rows, illuminating at 1-second intervals with random 4-7 second delay before simultaneous extinction. Transponders detect false starts triggering penalties.

**Circuit configuration variants** include multiple layouts per venue (Bahrain has 6 configurations), track length variations, turn count changes, direction (clockwise/anti-clockwise), elevation profiles, corner speed classifications, surface specifications, kerb types and profiles, run-off area modifications, barrier upgrades (TecPro installations), and FIA grade ratings (all F1 circuits Grade 1).

**Financial regulations** data includes cost cap figures ($135M for 2024-2025 adjusted for inflation), excluded costs (driver salaries for top 3 earners, marketing), power unit cost caps (€15M maximum per customer), wind tunnel/CFD allocation based on championship position (reversed order - last place gets most development time), and compliance monitoring.

**Testing restrictions** track pre-season testing days, tire testing regulations, TPC (Testing of Previous Cars) allowances, Young Driver Tests (must be ≤2 F1 races), FP1 mandatory young driver sessions (one per team per season), and filming day limitations.

**Driver transfers and market** capture contract duration, option clauses, mid-season changes (teams allowed maximum 4 different race drivers per season), loan arrangements, reserve driver appointments, young driver programs, and historical transfer patterns.

**Retirements and classification rules** specify 90% distance requirement for classification (rounded down), DNF ordering by laps completed, same-lap retirement ordering by last crossing time, lap 1 non-completion (not classified per rule 45.2), and half-points when race stopped before 75% distance.

**Blue flag compliance** particularly critical with 3 consecutive blue flags = penalty (usually drive-through), requirement to yield within 3 marshal posts, different rules for practice/qualifying (advisory) vs. race (mandatory), lapped driver unlapping procedures, and DRS restrictions until unlapping complete.

## Database implementation considerations

Your schema should separate **historical data** (1950-1995, 1996-2010, 2011-2017, 2018-2024, 2025+) into eras with distinct regulatory regimes, qualifying formats, points systems, and data availability. Lap times available from 1996+, pit stops from 2011+, real-time telemetry from 2018+.

Implement **temporal tracking** for regulation changes, using effective date ranges for technical specifications, points systems, qualifying formats, and penalty guidelines. Many entities need "valid from" and "valid to" dates.

Design **normalized relationships**: Driver-Team-Season (junction handles mid-season changes), Team-PowerUnit-Season (tracks supplier contracts), Race-Circuit-Season (handles circuit modifications), Component-Allocation (power unit pool management), Penalty-Application (links infractions to grid/time penalties), and Lap-TireStint (connects lap times to compound strategies).

Create **enumeration tables** for status codes (50+ DNF reasons), flag types (11 distinct flags), DRS states, track status values, session types, penalty categories, compound designations (C0-C6, Intermediate, Full Wet), and marshal sector boundaries.

Build **aggregate tables** for frequently-queried statistics: career totals, season summaries, head-to-head comparisons, circuit records, team performance matrices, and championship scenarios. These improve query performance dramatically.

Support **real-time updates** with streaming architecture for telemetry ingestion at 3.7 Hz, race control messages, position tracking, interval calculations, and live standings updates. Implement caching strategies as data volume reaches 50-100 MB per session.

## Data sources and APIs

**Ergast API** (ergast.com/mrd/) provides the foundational historical structure with 14 primary tables covering 1950-2024, available as MySQL/PostgreSQL dumps or CSV files. The successor **Jolpica F1 API** (api.jolpi.ca/ergast/f1/) maintains compatibility.

**OpenF1 API** (openf1.org) offers 15 endpoints with 100+ unique fields, real-time updates at 3-second latency, free historical data with paid real-time access, JSON and CSV formats, and telemetry from 2018 onwards.

**FastF1 Python library** accesses F1's official livetiming.formula1.com undocumented API with comprehensive data processing, pandas DataFrame outputs, automatic caching, no authentication required, and telemetry/timing from 2018+.

**Official F1 sources** include livetiming.formula1.com SignalR WebSocket streaming, F1 TV Pro for broadcast data, FIA document portal for official decisions, and team websites for personnel rosters.

**Statistics databases** like StatsF1, Formula1Points, GPRacingStats, and Pitwall provide comprehensive historical records, points conversions across eras, achievement tracking, and visualization tools.

This comprehensive entity framework enables building an F1 database matching or exceeding existing solutions while supporting modern real-time features, historical depth back to 1950, and advanced analytics capabilities. The total schema encompasses 50+ core entities, 200+ relationship tables, and thousands of enumerated values across the sport's 75-year history.
