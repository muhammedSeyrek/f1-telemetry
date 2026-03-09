package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/muhammedSeyrek/f1-telemetry/internal/api"
	"github.com/muhammedSeyrek/f1-telemetry/internal/display"
)

func main() {
	client := api.NewClient()

	if len(os.Args) < 2 {
		printHelp()
		return
	}

	cmd := strings.ToLower(os.Args[1])

	switch cmd {

	case "takvim", "schedule":
		season := argOr(os.Args, 2, "current")
		races, err := client.GetSchedule(season)
		if err != nil { display.Error(err.Error()); return }
		display.Schedule(races, season)

	case "son", "last":
		results, race, err := client.GetLastRaceResult()
		if err != nil { display.Error(err.Error()); return }
		display.RaceResults(results, race)

	case "sonuc", "result":
		season := argOr(os.Args, 2, "current")
		round := argOr(os.Args, 3, "last")
		results, race, err := client.GetRaceResult(season, round)
		if err != nil { display.Error(err.Error()); return }
		display.RaceResults(results, race)

	case "pit":
		season := argOr(os.Args, 2, "current")
		round := argOr(os.Args, 3, "last")
		pitStops, race, err := client.GetPitStops(season, round)
		if err != nil { display.Error(err.Error()); return }
		display.PitStops(pitStops, race)

	case "tur", "lap":
		season := argOr(os.Args, 2, "current")
		round := argOr(os.Args, 3, "last")
		lap := argOr(os.Args, 4, "1")
		laps, err := client.GetLapTimes(season, round, lap)
		if err != nil { display.Error(err.Error()); return }
		display.LapTimes(laps, season, round)

	case "siralama", "drivers":
		season := argOr(os.Args, 2, "current")
		standings, err := client.GetDriverStandings(season)
		if err != nil { display.Error(err.Error()); return }
		display.DriverStandings(standings, season)

	case "takim", "constructors":
		season := argOr(os.Args, 2, "current")
		standings, err := client.GetConstructorStandings(season)
		if err != nil { display.Error(err.Error()); return }
		display.ConstructorStandings(standings, season)

	case "quali", "qualifying":
		season := argOr(os.Args, 2, "current")
		round := argOr(os.Args, 3, "last")
		results, race, err := client.GetQualifying(season, round)
		if err != nil { display.Error(err.Error()); return }
		display.Qualifying(results, race)

	default:
		printHelp()
	}
}

func argOr(args []string, i int, fallback string) string {
	if i < len(args) { return args[i] }
	return fallback
}

func printHelp() {
	cyan := "\033[36m"
	bold := "\033[1m"
	reset := "\033[0m"
	yellow := "\033[33m"

	fmt.Printf("\n%s%s🏎  F1 Telemetri CLI%s\n", bold, cyan, reset)
	fmt.Println(strings.Repeat("═", 55))
	fmt.Printf("%sKullanım:%s f1 <komut> [sezon] [tur]\n\n", bold, reset)
	fmt.Printf("%sKomutlar:%s\n", yellow, reset)
	cmds := [][]string{
		{"son", "Son yarışın sonucunu göster"},
		{"sonuc [sezon] [tur]", "Belirli yarışın sonucunu göster"},
		{"takvim [sezon]", "Sezon takvimini göster"},
		{"siralama [sezon]", "Sürücü şampiyonası sıralaması"},
		{"takim [sezon]", "Constructor şampiyonası"},
		{"pit [sezon] [tur]", "Pit stop analizi"},
		{"quali [sezon] [tur]", "Qualifying sonuçları"},
		{"tur [sezon] [tur] [lap]", "Belirli tur zamanları"},
	}
	for _, c := range cmds {
		fmt.Printf("  %s%-30s%s %s\n", cyan, c[0], reset, c[1])
	}
	fmt.Printf("\n%sÖrnekler:%s\n", yellow, reset)
	fmt.Println("  f1 son                    → Son yarış sonucu")
	fmt.Println("  f1 sonuc 2024 5           → 2024 5. yarış")
	fmt.Println("  f1 siralama 2024          → 2024 sürücü sıralaması")
	fmt.Println("  f1 pit 2024 5             → 2024/5 pit stopları")
	fmt.Println("  f1 quali current last     → Son qualifying")
	fmt.Println("  f1 tur 2024 5 20          → 2024/5 yarışı 20. tur")
	fmt.Println()
}
