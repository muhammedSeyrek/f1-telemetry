package display

import (
	"fmt"
	"math"
	"sort"
	"strconv"
	"strings"

	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

const (
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Cyan   = "\033[36m"
	Bold   = "\033[1m"
	Reset  = "\033[0m"
	Gray   = "\033[90m"
)

type RaceEntry struct {
	Round    int
	RaceName string
	Pos      int
	Points   float64
	Grid     int
	Status   string
	FastLap  bool
}

func Gold() string   { return "\033[33m\033[1m" }
func Silver() string { return "\033[37m" }
func Bronze() string { return "\033[33m" }

func orDash(s string) string {
	if s == "" {
		return "-"
	}
	return s
}

func Header(title string) {
	line := strings.Repeat("═", 62)
	fmt.Printf("\n%s%s%s\n", Cyan, line, Reset)
	fmt.Printf("%s%s  🏎  %s%s\n", Bold, Cyan, title, Reset)
	fmt.Printf("%s%s%s\n\n", Cyan, line, Reset)
}

func SectionTitle(s string) {
	fmt.Printf("\n%s%s▶ %s%s\n", Bold, Yellow, s, Reset)
	fmt.Println(strings.Repeat("─", 50))
}

func Error(msg string) {
	fmt.Printf("\n%s❌ Hata: %s%s\n", Red, msg, Reset)
}

// ─────────────────────────────────────────────
// YARIŞ SONUÇLARI
// ─────────────────────────────────────────────

func RaceResults(results []models.RaceResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s — Tur %s", race.Season, race.RaceName, race.Round))
	SectionTitle("Yarış Sonuçları")

	fmt.Printf("%-4s %-4s %-24s %-22s %-6s %-6s %s\n",
		"Pos", "No", "Sürücü", "Takım", "Puan", "Tur", "Durum")
	fmt.Println(strings.Repeat("─", 82))

	for _, r := range results {
		color := Reset
		switch r.Position {
		case "1":
			color = Gold()
		case "2":
			color = Silver()
		case "3":
			color = Bronze()
		}
		fmt.Printf("%s%-4s %-4s %-24s %-22s %-6s %-6s %s%s\n",
			color,
			r.Position, r.Number,
			r.Driver.GivenName+" "+r.Driver.FamilyName,
			r.Constructor.Name,
			r.Points, r.Laps, r.Status,
			Reset,
		)
	}

	for _, r := range results {
		if r.FastestLap != nil && r.FastestLap.Rank == "1" {
			fmt.Printf("\n%s⚡ En Hızlı Tur:%s %s %s — %s (Ort: %s %s)\n",
				Yellow, Reset,
				r.Driver.Code, r.Driver.FamilyName,
				r.FastestLap.Time.Time,
				r.FastestLap.AverageSpeed.Speed,
				r.FastestLap.AverageSpeed.Units,
			)
		}
	}
}

// ─────────────────────────────────────────────
// PIT STOP ANALİZİ
// ─────────────────────────────────────────────

func PitStops(pitStops []models.PitStop, race *models.Race) {
	Header(fmt.Sprintf("%s %s — Pit Stop Analizi", race.Season, race.RaceName))

	// Sürücü başına grupla
	type driverPits struct {
		stops   []models.PitStop
		total   float64
		fastest float64
	}
	grouped := map[string]*driverPits{}
	order := []string{}

	for _, p := range pitStops {
		if _, ok := grouped[p.DriverID]; !ok {
			grouped[p.DriverID] = &driverPits{fastest: 99999}
			order = append(order, p.DriverID)
		}
		grouped[p.DriverID].stops = append(grouped[p.DriverID].stops, p)
		dur, err := strconv.ParseFloat(p.Duration, 64)
		if err == nil {
			grouped[p.DriverID].total += dur
			if dur < grouped[p.DriverID].fastest {
				grouped[p.DriverID].fastest = dur
			}
		}
	}

	// En hızlı pit süresini bul
	globalFastest := 99999.0
	for _, d := range grouped {
		if d.fastest < globalFastest {
			globalFastest = d.fastest
		}
	}

	SectionTitle(fmt.Sprintf("Toplam %d pit stop — %d sürücü", len(pitStops), len(grouped)))
	fmt.Printf("%-22s %-5s %-10s %-10s %s\n", "Sürücü", "Stop", "En Hızlı", "Toplam", "Turlar")
	fmt.Println(strings.Repeat("─", 60))

	for _, id := range order {
		d := grouped[id]
		laps := []string{}
		for _, s := range d.stops {
			laps = append(laps, s.Lap)
		}

		color := Reset
		if d.fastest == globalFastest {
			color = Green
		}

		fastest := fmt.Sprintf("%.3fs", d.fastest)
		total := fmt.Sprintf("%.3fs", d.total)

		fmt.Printf("%s%-22s %-5d %-10s %-10s Tur: %s%s\n",
			color,
			id,
			len(d.stops),
			fastest,
			total,
			strings.Join(laps, ", "),
			Reset,
		)
	}

	fmt.Printf("\n%s🏆 En hızlı pit: %.3f sn%s\n", Green, globalFastest, Reset)

	// Detay tablosu
	SectionTitle("Stop Detayları")
	fmt.Printf("%-22s %-5s %-6s %-10s %s\n", "Sürücü", "Tur", "Stop#", "Süre", "Saat")
	fmt.Println(strings.Repeat("─", 58))
	for _, p := range pitStops {
		dur, _ := strconv.ParseFloat(p.Duration, 64)
		color := Reset
		if dur == globalFastest {
			color = Green
		}
		fmt.Printf("%s%-22s %-5s %-6s %-10s %s%s\n",
			color, p.DriverID, p.Lap, p.Stop, p.Duration, p.Time, Reset)
	}
}

// ─────────────────────────────────────────────
// SÜRÜCÜ KARŞILAŞTIRMASI
// ─────────────────────────────────────────────

func DriverComparison(d1, d2 string, results []models.RaceResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s — Sürücü Karşılaştırması", race.Season, race.RaceName))

	var r1, r2 *models.RaceResult
	for i := range results {
		code := strings.ToLower(results[i].Driver.Code)
		id := strings.ToLower(results[i].Driver.DriverID)
		fam := strings.ToLower(results[i].Driver.FamilyName)
		num := results[i].Number

		q1 := strings.ToLower(d1)
		if code == q1 || id == q1 || fam == q1 || num == d1 {
			r1 = &results[i]
		}
		q2 := strings.ToLower(d2)
		if code == q2 || id == q2 || fam == q2 || num == d2 {
			r2 = &results[i]
		}
	}

	if r1 == nil || r2 == nil {
		if r1 == nil {
			Error(fmt.Sprintf("'%s' bulunamadı", d1))
		}
		if r2 == nil {
			Error(fmt.Sprintf("'%s' bulunamadı", d2))
		}
		return
	}

	name1 := r1.Driver.GivenName + " " + r1.Driver.FamilyName
	name2 := r2.Driver.GivenName + " " + r2.Driver.FamilyName

	fmt.Printf("\n%-28s %-14s %s\n", name1, "  KRITER", name2)
	fmt.Println(strings.Repeat("─", 65))

	printRow := func(label, v1, v2 string, lowerBetter bool) {
		c1, c2 := Reset, Reset
		n1, err1 := strconv.ParseFloat(v1, 64)
		n2, err2 := strconv.ParseFloat(v2, 64)
		if err1 == nil && err2 == nil {
			if lowerBetter {
				if n1 < n2 {
					c1 = Green
				} else if n2 < n1 {
					c2 = Green
				}
			} else {
				if n1 > n2 {
					c1 = Green
				} else if n2 > n1 {
					c2 = Green
				}
			}
		}
		fmt.Printf("%s%-28s%s %-14s %s%s%s\n", c1, v1, Reset, label, c2, v2, Reset)
	}

	printRow("Pozisyon", r1.Position, r2.Position, true)
	printRow("Grid", r1.Grid, r2.Grid, true)
	printRow("Puan", r1.Points, r2.Points, false)
	printRow("Tur", r1.Laps, r2.Laps, false)
	printRow("Durum", r1.Status, r2.Status, false)

	if r1.Time != nil {
		fmt.Printf("\n%-28s %-14s\n", r1.Time.Time, "Yarış Süresi")
	}
	if r2.Time != nil {
		fmt.Printf("%-28s %-14s %s\n", "", "", r2.Time.Time)
	}

	if r1.FastestLap != nil && r2.FastestLap != nil {
		fmt.Println()
		SectionTitle("En Hızlı Tur")
		printRow("Tur Zamanı", r1.FastestLap.Time.Time, r2.FastestLap.Time.Time, true)
		printRow("Ort. Hız",
			r1.FastestLap.AverageSpeed.Speed+" "+r1.FastestLap.AverageSpeed.Units,
			r2.FastestLap.AverageSpeed.Speed+" "+r2.FastestLap.AverageSpeed.Units,
			false)
	}

	pos1, _ := strconv.Atoi(r1.Position)
	pos2, _ := strconv.Atoi(r2.Position)
	fmt.Println()
	if pos1 < pos2 {
		fmt.Printf("%s🏆 Bu yarışı %s kazandı%s\n", Gold(), name1, Reset)
	} else if pos2 < pos1 {
		fmt.Printf("%s🏆 Bu yarışı %s kazandı%s\n", Gold(), name2, Reset)
	} else {
		fmt.Printf("%sBerabere!%s\n", Yellow, Reset)
	}
}

// Yeni: yarış sonuçlarından sürücü seçici listesi
func PrintDriverSelector(results []models.RaceResult) {
	SectionTitle("Sürücüleri Seç")
	fmt.Printf("  %-4s %-5s %-24s %-20s %s\n", "No", "Yarış", "Sürücü", "Takım", "Kod")
	fmt.Println("  " + strings.Repeat("─", 65))
	for _, r := range results {
		fmt.Printf("  %-4s %-5s %-24s %-20s %s\n",
			r.Number,
			r.Position,
			r.Driver.GivenName+" "+r.Driver.FamilyName,
			r.Constructor.Name,
			r.Driver.Code,
		)
	}
	fmt.Println()
	fmt.Printf("  %sKod veya Yarış No ile seç (örn: VER veya 33)%s\n", Gray, Reset)
}

// ─────────────────────────────────────────────
// QUALİFYİNG + GRİD vs FİNİŞ
// ─────────────────────────────────────────────

func Qualifying(results []models.QualifyingResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s — Qualifying", race.Season, race.RaceName))

	fmt.Printf("%-4s %-24s %-20s %-10s %-10s %s\n",
		"Pos", "Sürücü", "Takım", "Q1", "Q2", "Q3")
	fmt.Println(strings.Repeat("─", 82))

	for _, q := range results {
		color := Reset
		switch q.Position {
		case "1":
			color = Gold()
		case "2":
			color = Silver()
		case "3":
			color = Bronze()
		}
		fmt.Printf("%s%-4s %-24s %-20s %-10s %-10s %s%s\n",
			color,
			q.Position,
			q.Driver.GivenName+" "+q.Driver.FamilyName,
			q.Constructor.Name,
			orDash(q.Q1), orDash(q.Q2), orDash(q.Q3),
			Reset,
		)
	}
}

func GridVsFinish(qualiResults []models.QualifyingResult, raceResults []models.RaceResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s — Grid vs Finiş Analizi", race.Season, race.RaceName))

	// Grid pozisyonlarını map'e al
	gridMap := map[string]string{}
	for _, q := range qualiResults {
		gridMap[q.Driver.DriverID] = q.Position
	}

	type row struct {
		name   string
		grid   int
		finish int
		gain   int
	}
	rows := []row{}

	for _, r := range raceResults {
		grid, _ := strconv.Atoi(r.Grid)
		finish, _ := strconv.Atoi(r.Position)
		if finish == 0 {
			continue
		}
		rows = append(rows, row{
			name:   r.Driver.GivenName + " " + r.Driver.FamilyName,
			grid:   grid,
			finish: finish,
			gain:   grid - finish, // pozitif = pozisyon kazandı
		})
	}

	// Kazanıma göre sırala
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].gain > rows[j].gain
	})

	SectionTitle("Pozisyon Değişimleri (Grid → Finiş)")
	fmt.Printf("%-26s %-6s %-8s %s\n", "Sürücü", "Grid", "Finiş", "Değişim")
	fmt.Println(strings.Repeat("─", 55))

	for _, r := range rows {
		color := Reset
		arrow := "→"
		gainStr := fmt.Sprintf("%+d", r.gain)

		if r.gain > 0 {
			color = Green
			arrow = "↑"
		} else if r.gain < 0 {
			color = Red
			arrow = "↓"
		} else {
			color = Gray
		}

		fmt.Printf("%-26s %-6d %-8d %s%s %s%s\n",
			r.name, r.grid, r.finish,
			color, arrow, gainStr, Reset,
		)
	}

	// En çok kazanan / kaybedenler
	if len(rows) > 0 {
		fmt.Println()
		best := rows[0]
		worst := rows[len(rows)-1]
		if best.gain > 0 {
			fmt.Printf("%s🚀 En çok kazanan: %s (%+d pozisyon)%s\n", Green, best.name, best.gain, Reset)
		}
		if worst.gain < 0 {
			fmt.Printf("%s📉 En çok kaybeden: %s (%+d pozisyon)%s\n", Red, worst.name, worst.gain, Reset)
		}
	}
}

// ─────────────────────────────────────────────
// SEZON ÖZETİ
// ─────────────────────────────────────────────

func SeasonDashboard(races []models.Race, standings []models.DriverStanding, constructors []models.ConstructorStanding, season string) {
	Header(fmt.Sprintf("%s Sezon Özeti", season))

	// Tamamlanan yarışlar
	completed := []models.Race{}
	for _, r := range races {
		if len(r.Results) > 0 {
			completed = append(completed, r)
		}
	}

	fmt.Printf("%sToplam Yarış:%s %d  |  %sTamamlanan:%s %d  |  %sKalan:%s %d\n\n",
		Bold, Reset, len(races),
		Bold, Reset, len(completed),
		Bold, Reset, len(races)-len(completed),
	)

	// Top 5 sürücü sıralaması
	SectionTitle("🏆 Sürücü Şampiyonası — Top 10")
	fmt.Printf("%-4s %-26s %-20s %-8s %s\n", "Pos", "Sürücü", "Takım", "Puan", "Galibiyet")
	fmt.Println(strings.Repeat("─", 65))

	limit := 10
	if len(standings) < limit {
		limit = len(standings)
	}
	for _, s := range standings[:limit] {
		team := ""
		if len(s.Constructors) > 0 {
			team = s.Constructors[0].Name
		}
		color := Reset
		if s.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-26s %-20s %-8s %s%s\n",
			color,
			s.Position,
			s.Driver.GivenName+" "+s.Driver.FamilyName,
			team, s.Points, s.Wins,
			Reset,
		)
	}

	// Constructor sıralaması
	SectionTitle("🏭 Constructor Şampiyonası")
	fmt.Printf("%-4s %-26s %-8s %s\n", "Pos", "Takım", "Puan", "Galibiyet")
	fmt.Println(strings.Repeat("─", 50))

	climit := 10
	if len(constructors) < climit {
		climit = len(constructors)
	}
	for _, c := range constructors[:climit] {
		color := Reset
		if c.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-26s %-8s %s%s\n",
			color, c.Position, c.Constructor.Name, c.Points, c.Wins, Reset,
		)
	}

	// Yarış takvimi özeti
	SectionTitle("📅 Yarış Takvimi")
	fmt.Printf("%-4s %-30s %-12s %s\n", "Tur", "Yarış", "Tarih", "Kazanan")
	fmt.Println(strings.Repeat("─", 70))

	for _, r := range races {
		winner := Gray + "Henüz yok" + Reset
		color := Gray
		if len(r.Results) > 0 {
			w := r.Results[0]
			winner = w.Driver.Code + " " + w.Driver.FamilyName
			color = Reset
		}
		fmt.Printf("%s%-4s %-30s %-12s %s%s\n",
			color, r.Round, r.RaceName, r.Date, winner, Reset,
		)
	}
}

// ─────────────────────────────────────────────
// SÜRÜCÜ SIRALAMASI
// ─────────────────────────────────────────────

func DriverStandings(standings []models.DriverStanding, season string) {
	Header(fmt.Sprintf("%s Sürücü Şampiyonası", season))
	fmt.Printf("%-4s %-26s %-20s %-8s %s\n", "Pos", "Sürücü", "Takım", "Puan", "Galibiyet")
	fmt.Println(strings.Repeat("─", 65))
	for _, s := range standings {
		team := ""
		if len(s.Constructors) > 0 {
			team = s.Constructors[0].Name
		}
		color := Reset
		if s.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-26s %-20s %-8s %s%s\n",
			color, s.Position,
			s.Driver.GivenName+" "+s.Driver.FamilyName,
			team, s.Points, s.Wins, Reset,
		)
	}
}

func ConstructorStandings(standings []models.ConstructorStanding, season string) {
	Header(fmt.Sprintf("%s Constructors Şampiyonası", season))
	fmt.Printf("%-4s %-26s %-10s %s\n", "Pos", "Takım", "Puan", "Galibiyet")
	fmt.Println(strings.Repeat("─", 52))
	for _, s := range standings {
		color := Reset
		if s.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-26s %-10s %s%s\n",
			color, s.Position, s.Constructor.Name, s.Points, s.Wins, Reset,
		)
	}
}

func Schedule(races []models.Race, season string) {
	Header(fmt.Sprintf("%s Formula 1 Takvimi", season))
	fmt.Printf("%-4s %-32s %-26s %s\n", "Tur", "Yarış", "Pist", "Tarih")
	fmt.Println(strings.Repeat("─", 78))
	for _, r := range races {
		fmt.Printf("%-4s %-32s %-26s %s\n",
			r.Round, r.RaceName, r.Circuit.CircuitName, r.Date,
		)
	}
}

func LapTimes(laps []models.Lap, season, round string) {
	if len(laps) == 0 {
		fmt.Println("Tur verisi yok.")
		return
	}
	lap := laps[0]
	Header(fmt.Sprintf("Sezon %s Tur %s — Lap %s Zamanları", season, round, lap.Number))
	fmt.Printf("%-5s %-20s %s\n", "Pos", "Sürücü", "Zaman")
	fmt.Println(strings.Repeat("─", 40))
	for _, t := range lap.Timings {
		fmt.Printf("%-5s %-20s %s\n", t.Position, t.DriverID, t.Time)
	}
}

// ─────────────────────────────────────────────
// SEZON BOYUNCA SÜRÜCÜ ANALİZİ
// ─────────────────────────────────────────────

func DriverSeasonAnalysis(races1, races2 []models.Race, d1Name, d2Name, season string) {
	Header(fmt.Sprintf("%s — %s vs %s Sezon Analizi", season, d1Name, d2Name))

	parse := func(races []models.Race) []RaceEntry {
		entries := []RaceEntry{}
		for _, r := range races {
			if len(r.Results) == 0 {
				continue
			}
			res := r.Results[0]
			round, _ := strconv.Atoi(r.Round)
			pos, _ := strconv.Atoi(res.Position)
			pts, _ := strconv.ParseFloat(res.Points, 64)
			grid, _ := strconv.Atoi(res.Grid)
			fastLap := res.FastestLap != nil && res.FastestLap.Rank == "1"
			entries = append(entries, RaceEntry{Round: round, RaceName: r.RaceName, Pos: pos, Points: pts, Grid: grid, Status: res.Status, FastLap: fastLap})
		}
		return entries
	}

	e1 := parse(races1)
	e2 := parse(races2)

	// Round bazlı map
	map1 := map[int]RaceEntry{}
	map2 := map[int]RaceEntry{}
	for _, e := range e1 {
		map1[e.Round] = e
	}
	for _, e := range e2 {
		map2[e.Round] = e
	}

	// Tüm roundları topla
	roundSet := map[int]string{}
	for _, e := range e1 {
		roundSet[e.Round] = e.RaceName
	}
	for _, e := range e2 {
		roundSet[e.Round] = e.RaceName
	}

	rounds := []int{}
	for r := range roundSet {
		rounds = append(rounds, r)
	}
	sortInts(rounds)

	// ── TUR TUR KARŞILAŞTIRMA ──
	SectionTitle("Tur Tur Karşılaştırma")
	fmt.Printf("%-3s %-28s  %-18s  %-18s  %s\n",
		"Tur", "Yarış", d1Name, d2Name, "Kazanan")
	fmt.Println(strings.Repeat("─", 85))

	d1Wins, d2Wins := 0, 0
	for _, r := range rounds {
		name := roundSet[r]
		if len(name) > 26 {
			name = name[:26]
		}

		v1, ok1 := map1[r]
		v2, ok2 := map2[r]

		s1, s2 := "-", "-"
		if ok1 {
			s1 = fmt.Sprintf("P%-2d  %5.0f pts", v1.Pos, v1.Points)
		}
		if ok2 {
			s2 = fmt.Sprintf("P%-2d  %5.0f pts", v2.Pos, v2.Points)
		}

		winner := ""
		c1, c2 := Reset, Reset
		if ok1 && ok2 {
			if v1.Pos < v2.Pos {
				c1 = Green
				winner = Green + "← " + d1Name + Reset
				d1Wins++
			} else if v2.Pos < v1.Pos {
				c2 = Green
				winner = Green + d2Name + " →" + Reset
				d2Wins++
			} else {
				winner = Gray + "Berabere" + Reset
			}
		}

		fmt.Printf("%-3d %-28s  %s%-18s%s  %s%-18s%s  %s\n",
			r, name,
			c1, s1, Reset,
			c2, s2, Reset,
			winner,
		)
	}

	// ── ÖZET İSTATİSTİKLER ──
	SectionTitle("Özet İstatistikler")

	stats := func(entries []RaceEntry) (totalPts float64, wins, podiums, dnfs, fastLaps int, avgPos float64, bestPos, worstPos int) {
		bestPos = 999
		worstPos = 0
		posSum := 0
		finishes := 0
		for _, e := range entries {
			totalPts += e.Points
			if e.Pos == 1 {
				wins++
			}
			if e.Pos <= 3 {
				podiums++
			}
			if e.Status != "Finished" && !strings.HasPrefix(e.Status, "+") {
				dnfs++
			}
			if e.FastLap {
				fastLaps++
			}
			if e.Pos < bestPos {
				bestPos = e.Pos
			}
			if e.Pos > worstPos {
				worstPos = e.Pos
			}
			posSum += e.Pos
			finishes++
		}
		if finishes > 0 {
			avgPos = float64(posSum) / float64(finishes)
		}
		return
	}

	pts1, wins1, pod1, dnf1, fl1, avg1, best1, worst1 := stats(e1)
	pts2, wins2, pod2, dnf2, fl2, avg2, best2, worst2 := stats(e2)

	printStatRow := func(label string, v1, v2 float64, lowerBetter bool, format string) {
		c1, c2 := Reset, Reset
		if v1 != v2 {
			if lowerBetter {
				if v1 < v2 {
					c1 = Green
				} else {
					c2 = Green
				}
			} else {
				if v1 > v2 {
					c1 = Green
				} else {
					c2 = Green
				}
			}
		}
		s1 := fmt.Sprintf(format, v1)
		s2 := fmt.Sprintf(format, v2)
		fmt.Printf("  %-20s  %s%-12s%s  %s%-12s%s\n",
			label, c1, s1, Reset, c2, s2, Reset)
	}

	fmt.Printf("\n  %-20s  %-12s  %s\n", "", d1Name, d2Name)
	fmt.Println("  " + strings.Repeat("─", 50))
	printStatRow("Toplam Puan", pts1, pts2, false, "%.0f")
	printStatRow("Galibiyet", float64(wins1), float64(wins2), false, "%.0f")
	printStatRow("Podyum", float64(pod1), float64(pod2), false, "%.0f")
	printStatRow("DNF", float64(dnf1), float64(dnf2), true, "%.0f")
	printStatRow("En Hızlı Tur", float64(fl1), float64(fl2), false, "%.0f")
	printStatRow("Ort. Pozisyon", avg1, avg2, true, "%.2f")
	printStatRow("En İyi Sonuç", float64(best1), float64(best2), true, "P%.0f")
	printStatRow("En Kötü Sonuç", float64(worst1), float64(worst2), true, "P%.0f")

	// Puan farkı
	diff := pts1 - pts2
	fmt.Println()
	if diff > 0 {
		fmt.Printf("  %s🏆 %s sezonu %+.0f puan farkıyla önde bitirdi%s\n", Gold(), d1Name, diff, Reset)
	} else if diff < 0 {
		fmt.Printf("  %s🏆 %s sezonu %+.0f puan farkıyla önde bitirdi%s\n", Gold(), d2Name, diff, Reset)
	} else {
		fmt.Printf("  %sBerabere!%s\n", Yellow, Reset)
	}

	// Baş başa skor
	fmt.Printf("  %sH2H:%s %s %d — %d %s\n",
		Bold, Reset, d1Name, d1Wins, d2Wins, d2Name)

	// ── POZİSYON GRAFİĞİ ──
	SectionTitle("Pozisyon Grafiği (ASCII)")
	printPositionChart(rounds, map1, map2, d1Name, d2Name)
}

func printPositionChart(rounds []int, map1, map2 map[int]RaceEntry, name1, name2 string) {
	maxPos := 20
	barWidth := 40

	fmt.Printf("  %-4s %-28s %s\n", "Tur", name1+" ("+Green+"■"+Reset+")", name2+" ("+Cyan+"■"+Reset+")")
	fmt.Println("  " + strings.Repeat("─", 75))

	for _, r := range rounds {
		v1, ok1 := map1[r]
		v2, ok2 := map2[r]

		p1str, p2str := "-", "-"
		bar1, bar2 := "", ""

		if ok1 {
			p1str = fmt.Sprintf("P%d", v1.Pos)
			filled := int(math.Round(float64(barWidth) * float64(maxPos-v1.Pos+1) / float64(maxPos)))
			if filled < 1 {
				filled = 1
			}
			bar1 = Green + strings.Repeat("■", filled) + Reset
		}
		if ok2 {
			p2str = fmt.Sprintf("P%d", v2.Pos)
			filled := int(math.Round(float64(barWidth) * float64(maxPos-v2.Pos+1) / float64(maxPos)))
			if filled < 1 {
				filled = 1
			}
			bar2 = Cyan + strings.Repeat("■", filled) + Reset
		}

		fmt.Printf("  %-4d %-6s %s\n", r, p1str, bar1)
		fmt.Printf("       %-6s %s\n", p2str, bar2)
		fmt.Println()
	}
}

func sortInts(a []int) {
	for i := 0; i < len(a); i++ {
		for j := i + 1; j < len(a); j++ {
			if a[j] < a[i] {
				a[i], a[j] = a[j], a[i]
			}
		}
	}
}

// ─────────────────────────────────────────────
// TUR ANALİZİ
// ─────────────────────────────────────────────

func LapAnalysis(laps []models.Lap, season, round string) {
	Header(fmt.Sprintf("Sezon %s Tur %s — Tur Analizi", season, round))

	if len(laps) == 0 {
		Error("Tur verisi bulunamadı")
		return
	}

	SectionTitle(fmt.Sprintf("Toplam %d tur", len(laps)))
	fmt.Printf("%-5s %-22s %-12s %s\n", "Tur", "En Hızlı Sürücü", "Zaman", "2. Sürücü")
	fmt.Println(strings.Repeat("─", 55))

	driverFastest := map[string]int{}

	for _, lap := range laps {
		if len(lap.Timings) == 0 {
			continue
		}
		best := lap.Timings[0]
		second := ""
		if len(lap.Timings) > 1 {
			second = lap.Timings[1].Time
		}
		driverFastest[best.DriverID]++
		fmt.Printf("%-5s %-22s %-12s %s\n", lap.Number, best.DriverID, best.Time, second)
	}

	SectionTitle("En Çok En Hızlı Tur")
	type dc struct {
		id    string
		count int
	}
	var counts []dc
	for id, c := range driverFastest {
		counts = append(counts, dc{id, c})
	}
	sort.Slice(counts, func(i, j int) bool { return counts[i].count > counts[j].count })

	for i, d := range counts {
		if i >= 10 {
			break
		}
		color := Reset
		if i == 0 {
			color = Gold()
		}
		fmt.Printf("%s  %-22s %d tur%s\n", color, d.id, d.count, Reset)
	}
}
