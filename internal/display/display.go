package display

import (
	"fmt"
	"strings"

	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

// Renkler (terminal ANSI)
const (
	Red    = "\033[31m"
	Green  = "\033[32m"
	Yellow = "\033[33m"
	Cyan   = "\033[36m"
	Bold   = "\033[1m"
	Reset  = "\033[0m"
	Gray   = "\033[90m"
)

func Header(title string) {
	line := strings.Repeat("═", 60)
	fmt.Printf("\n%s%s%s\n", Cyan, line, Reset)
	fmt.Printf("%s%s  🏎  %s%s\n", Bold, Cyan, title, Reset)
	fmt.Printf("%s%s%s\n\n", Cyan, line, Reset)
}

func SectionTitle(s string) {
	fmt.Printf("\n%s%s▶ %s%s\n", Bold, Yellow, s, Reset)
	fmt.Println(strings.Repeat("─", 50))
}

// --- Yarış Sonuçları ---

func RaceResults(results []models.RaceResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s - Tur %s", race.Season, race.RaceName, race.Round))
	SectionTitle("Yarış Sonuçları")

	fmt.Printf("%-4s %-4s %-22s %-20s %-8s %-8s %s\n",
		"Pos", "No", "Sürücü", "Takım", "Puan", "Turar", "Durum")
	fmt.Println(strings.Repeat("─", 80))

	for _, r := range results {
		pos := r.Position
		color := Reset
		switch pos {
		case "1":
			color = Gold()
		case "2":
			color = "\033[37m" // silver
		case "3":
			color = "\033[33m" // bronze
		}

		timeStr := "-"
		if r.Time != nil {
			timeStr = r.Time.Time
		}

		fmt.Printf("%s%-4s %-4s %-22s %-20s %-8s %-8s %s%s\n",
			color,
			r.Position,
			r.Number,
			r.Driver.GivenName+" "+r.Driver.FamilyName,
			r.Constructor.Name,
			r.Points,
			r.Laps,
			r.Status,
			Reset,
		)
		_ = timeStr
	}

	// En hızlı tur
	for _, r := range results {
		if r.FastestLap != nil && r.FastestLap.Rank == "1" {
			fmt.Printf("\n%s⚡ En Hızlı Tur:%s %s %s - %s (Ort: %s %s)\n",
				Yellow, Reset,
				r.Driver.Code,
				r.Driver.FamilyName,
				r.FastestLap.Time.Time,
				r.FastestLap.AverageSpeed.Speed,
				r.FastestLap.AverageSpeed.Units,
			)
		}
	}
}

// --- Pit Stopları ---

func PitStops(pitStops []models.PitStop, race *models.Race) {
	Header(fmt.Sprintf("%s %s - Pit Stopları", race.Season, race.RaceName))
	SectionTitle(fmt.Sprintf("Toplam %d pit stop", len(pitStops)))

	fmt.Printf("%-20s %-6s %-6s %-10s %s\n", "Sürücü", "Tur", "Stop", "Süre", "Zaman")
	fmt.Println(strings.Repeat("─", 55))

	for _, p := range pitStops {
		fmt.Printf("%-20s %-6s %-6s %-10s %s\n",
			p.DriverID, p.Lap, p.Stop, p.Duration, p.Time)
	}
}

// --- Driver Standings ---

func DriverStandings(standings []models.DriverStanding, season string) {
	Header(fmt.Sprintf("%s Sürücü Şampiyonası", season))

	fmt.Printf("%-4s %-25s %-20s %-8s %s\n",
		"Pos", "Sürücü", "Takım", "Puan", "Galibiyet")
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
		fmt.Printf("%s%-4s %-25s %-20s %-8s %s%s\n",
			color,
			s.Position,
			s.Driver.GivenName+" "+s.Driver.FamilyName,
			team,
			s.Points,
			s.Wins,
			Reset,
		)
	}
}

// --- Constructor Standings ---

func ConstructorStandings(standings []models.ConstructorStanding, season string) {
	Header(fmt.Sprintf("%s Constructors Şampiyonası", season))

	fmt.Printf("%-4s %-25s %-10s %s\n", "Pos", "Takım", "Puan", "Galibiyet")
	fmt.Println(strings.Repeat("─", 50))

	for _, s := range standings {
		color := Reset
		if s.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-25s %-10s %s%s\n",
			color,
			s.Position,
			s.Constructor.Name,
			s.Points,
			s.Wins,
			Reset,
		)
	}
}

// --- Takvim ---

func Schedule(races []models.Race, season string) {
	Header(fmt.Sprintf("%s Formula 1 Takvimi", season))

	fmt.Printf("%-4s %-30s %-25s %s\n", "Tur", "Yarış", "Pist", "Tarih")
	fmt.Println(strings.Repeat("─", 75))

	for _, r := range races {
		fmt.Printf("%-4s %-30s %-25s %s\n",
			r.Round,
			r.RaceName,
			r.Circuit.CircuitName,
			r.Date,
		)
	}
}

// --- Qualifying ---

func Qualifying(results []models.QualifyingResult, race *models.Race) {
	Header(fmt.Sprintf("%s %s - Qualifying", race.Season, race.RaceName))

	fmt.Printf("%-4s %-22s %-20s %-12s %-12s %s\n",
		"Pos", "Sürücü", "Takım", "Q1", "Q2", "Q3")
	fmt.Println(strings.Repeat("─", 80))

	for _, q := range results {
		color := Reset
		if q.Position == "1" {
			color = Gold()
		}
		fmt.Printf("%s%-4s %-22s %-20s %-12s %-12s %s%s\n",
			color,
			q.Position,
			q.Driver.GivenName+" "+q.Driver.FamilyName,
			q.Constructor.Name,
			orDash(q.Q1), orDash(q.Q2), orDash(q.Q3),
			Reset,
		)
	}
}

// --- Tur Zamanları ---

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

// --- Yardımcılar ---

func Gold() string { return "\033[33m\033[1m" }

func orDash(s string) string {
	if s == "" {
		return "-"
	}
	return s
}

func Error(msg string) {
	fmt.Printf("\n%s❌ Hata: %s%s\n", Red, msg, Reset)
}

func Info(msg string) {
	fmt.Printf("%s ℹ %s%s\n", Cyan, msg, Reset)
}
