package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/muhammedSeyrek/f1-telemetry/internal/api"
	"github.com/muhammedSeyrek/f1-telemetry/internal/display"
	"github.com/muhammedSeyrek/f1-telemetry/internal/live"
	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

func main() {
	// Komut satırından direkt çalıştırma (eski komutlar hâlâ çalışır)
	if len(os.Args) >= 2 && os.Args[1] != "menu" {
		runHistoric()
		return
	}

	// Ana menü
	mainMenu()
}

func mainMenu() {
	clearLine := "\033[H\033[2J"
	fmt.Print(clearLine)
	fmt.Println("\033[1m\033[36m")
	fmt.Println("  ███████╗ ██╗")
	fmt.Println("  ██╔════╝ ██║")
	fmt.Println("  █████╗   ██║  Telemetri CLI")
	fmt.Println("  ██╔══╝   ██║")
	fmt.Println("  ██║      ███████╗")
	fmt.Println("  ╚═╝      ╚══════╝\033[0m")
	fmt.Println()
	fmt.Println("\033[1m  Ne yapmak istiyorsun?\033[0m")
	fmt.Println()
	fmt.Println("  \033[36m[1]\033[0m  📡  Canlı Mod  (yarış sırasında)")
	fmt.Println("  \033[36m[2]\033[0m  📚  Geçmiş Veriler")
	fmt.Println("  \033[36m[q]\033[0m  👋  Çıkış")
	fmt.Println()
	fmt.Print("  Seçim: ")

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	choice := strings.TrimSpace(scanner.Text())

	switch choice {
	case "1":
		liveMenu()
	case "2":
		historicMenu()
	case "q", "Q":
		fmt.Println("\n\033[33m  Görüşürüz! 🏎\033[0m\n")
	default:
		mainMenu()
	}
}

// ─────────────────────────────────────────────
// CANLI MENÜ
// ─────────────────────────────────────────────

func liveMenu() {
	liveClient := api.NewLiveClient()

	fmt.Print("\033[H\033[2J")
	fmt.Println("\033[1m\033[36m  📡 Canlı Mod\033[0m")
	fmt.Println("\033[36m  " + strings.Repeat("═", 40) + "\033[0m")
	fmt.Println()
	fmt.Println("  \033[90mMevcut oturum alınıyor...\033[0m")

	session, err := liveClient.GetLatestSession()
	if err != nil || session == nil {
		display.Error("Aktif oturum bulunamadı. Yarış hafta sonu değil olabilir.")
		fmt.Println("\n  \033[90mOpenF1 geçmiş oturumlar için de çalışır.")
		fmt.Println("  Örnek geçmiş oturum için sezon+tur seçin:\033[0m")
		fmt.Print("\n  Ana menüye dön? [enter]: ")
		bufio.NewScanner(os.Stdin).Scan()
		mainMenu()
		return
	}

	fmt.Printf("\n  \033[32m✓ Oturum bulundu:\033[0m %s — %s (%s)\n",
		session.CountryName, session.SessionName, session.DateStart[:10])
	fmt.Println()
	fmt.Println("  \033[36m[1]\033[0m  🏁  Timing Tower     (canlı sıralama)")
	fmt.Println("  \033[36m[2]\033[0m  📻  Race Control     (SC, VSC, bayraklar)")
	fmt.Println("  \033[36m[3]\033[0m  🔧  Pit Takip        (lastik + süre)")
	fmt.Println("  \033[36m[4]\033[0m  📊  Araç Karşılaştır (throttle, fren, DRS)")
	fmt.Println("  \033[36m[b]\033[0m  ←   Geri")
	fmt.Println()
	fmt.Print("  Seçim: ")

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	choice := strings.TrimSpace(scanner.Text())

	switch choice {
	case "1":
		live.TimingTower(liveClient, session)
	case "2":
		live.RaceControlFeed(liveClient, session)
	case "3":
		live.PitTracker(liveClient, session)
	case "4":
		fmt.Print("\n  1. Sürücü kodu (örn: VER): ")
		s := bufio.NewScanner(os.Stdin)
		s.Scan()
		d1 := strings.ToUpper(strings.TrimSpace(s.Text()))
		fmt.Print("  2. Sürücü kodu (örn: NOR): ")
		s.Scan()
		d2 := strings.ToUpper(strings.TrimSpace(s.Text()))
		live.CarComparison(liveClient, session, d1, d2)
	case "b", "B":
		mainMenu()
		return
	}

	// Çıktıktan sonra tekrar menüye dön
	fmt.Print("\n  \033[90m[enter] ile menüye dön...\033[0m")
	bufio.NewScanner(os.Stdin).Scan()
	liveMenu()
}

// ─────────────────────────────────────────────
// GEÇMİŞ MENÜ
// ─────────────────────────────────────────────

func historicMenu() {
	fmt.Print("\033[H\033[2J")
	fmt.Println("\033[1m\033[36m  📚 Geçmiş Veriler\033[0m")
	fmt.Println("\033[36m  " + strings.Repeat("═", 40) + "\033[0m")
	fmt.Println()
	fmt.Println("  \033[90mKomut olarak da kullanabilirsin:\033[0m")
	fmt.Println("  f1.exe son / sezon / karsilastir / grid / pit ...\n")
	fmt.Println("  \033[36m[1]\033[0m  Son yarış sonucu")
	fmt.Println("  \033[36m[2]\033[0m  Sezon özeti")
	fmt.Println("  \033[36m[3]\033[0m  Sürücü sıralaması")
	fmt.Println("  \033[36m[4]\033[0m  Constructor sıralaması")
	fmt.Println("  \033[36m[5]\033[0m  Sürücü karşılaştırması")
	fmt.Println("  \033[36m[6]\033[0m  Pit stop analizi")
	fmt.Println("  \033[36m[7]\033[0m  Grid vs Finiş analizi")
	fmt.Println("  \033[36m[b]\033[0m  ←  Geri")
	fmt.Println()
	fmt.Print("  Seçim: ")

	scanner := bufio.NewScanner(os.Stdin)
	client := api.NewClient()

	scanner.Scan()
	choice := strings.TrimSpace(scanner.Text())

	season, round := "current", "last"
	if choice != "5" {
		season, round = promptSeasonRound(choice)
	}

	switch choice {
	case "1":
		r, race, err := client.GetLastRaceResult()
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.RaceResults(r, race)

	case "2":
		races, err := client.GetScheduleWithResults(season)
		if err != nil {
			display.Error(err.Error())
			break
		}
		drivers, _ := client.GetDriverStandings(season)
		constructors, _ := client.GetConstructorStandings(season)
		display.SeasonDashboard(races, drivers, constructors, season)

	case "3":
		s, err := client.GetDriverStandings(season)
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.DriverStandings(s, season)

	case "4":
		s, err := client.GetConstructorStandings(season)
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.ConstructorStandings(s, season)

	case "5":
		sc := bufio.NewScanner(os.Stdin)
		fmt.Print("  Sezon (örn: 2024, enter=current): ")
		sc.Scan()
		season := strings.TrimSpace(sc.Text())
		if season == "" {
			season = "current"
		}

		// Önce o sezonun son yarışından sürücü listesi göster
		lastRace, _, err := client.GetRaceResult(season, "last")
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.PrintDriverSelector(lastRace)

		fmt.Print("  1. Sürücü (Kod veya No): ")
		sc.Scan()
		d1input := strings.TrimSpace(sc.Text())
		fmt.Print("  2. Sürücü (Kod veya No): ")
		sc.Scan()
		d2input := strings.TrimSpace(sc.Text())

		// Kodu driverID'ye çevir
		d1id := resolveDriverID(d1input, lastRace)
		d2id := resolveDriverID(d2input, lastRace)
		if d1id == "" || d2id == "" {
			display.Error("Sürücü bulunamadı")
			break
		}

		fmt.Println()
		fmt.Println("  \033[36m[1]\033[0m  Tek yarış karşılaştırması")
		fmt.Println("  \033[36m[2]\033[0m  Tüm sezon analizi")
		fmt.Print("  Seçim: ")
		sc.Scan()
		mode := strings.TrimSpace(sc.Text())

		if mode == "1" {
			fmt.Print("  Tur (örn: 5, enter=last): ")
			sc.Scan()
			round := strings.TrimSpace(sc.Text())
			if round == "" {
				round = "last"
			}
			r, race, err := client.GetRaceResult(season, round)
			if err != nil {
				display.Error(err.Error())
				break
			}
			display.DriverComparison(d1input, d2input, r, race)
		} else {
			r1, r2, err := client.GetTwoDriversSeasonResults(season, d1id, d2id)
			if err != nil {
				display.Error(err.Error())
				break
			}
			d1Name := getDriverName(d1input, lastRace)
			d2Name := getDriverName(d2input, lastRace)
			display.DriverSeasonAnalysis(r1, r2, d1Name, d2Name, season)
		}

	case "6":
		pits, race, err := client.GetPitStops(season, round)
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.PitStops(pits, race)

	case "7":
		qr, race, err := client.GetQualifying(season, round)
		if err != nil {
			display.Error(err.Error())
			break
		}
		rr, _, err := client.GetRaceResult(season, round)
		if err != nil {
			display.Error(err.Error())
			break
		}
		display.Qualifying(qr, race)
		display.GridVsFinish(qr, rr, race)

	case "b", "B":
		mainMenu()
		return
	}

	fmt.Print("\n  \033[90m[enter] ile menüye dön...\033[0m")
	bufio.NewScanner(os.Stdin).Scan()
	historicMenu()
}

func promptSeasonRound(choice string) (string, string) {
	scanner := bufio.NewScanner(os.Stdin)

	fmt.Print("  Sezon (örn: 2024, enter=current): ")
	scanner.Scan()
	season := strings.TrimSpace(scanner.Text())
	if season == "" {
		season = "current"
	}

	// Sadece bu seçenekler tur sorar
	needsRound := map[string]bool{"1": false, "6": true, "7": true}
	if needsRound[choice] {
		fmt.Print("  Tur (örn: 5, enter=last): ")
		scanner.Scan()
		r := strings.TrimSpace(scanner.Text())
		if r != "" {
			return season, r
		}
	}
	return season, "last"
}

// ─────────────────────────────────────────────
// ESKİ KOMUT SATIRI MODU
// ─────────────────────────────────────────────

func runHistoric() {
	client := api.NewClient()

	switch strings.ToLower(os.Args[1]) {
	case "son", "last":
		r, race, err := client.GetLastRaceResult()
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.RaceResults(r, race)
	case "sonuc", "result":
		r, race, err := client.GetRaceResult(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.RaceResults(r, race)
	case "takvim", "schedule":
		races, err := client.GetSchedule(argOr(os.Args, 2, "current"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.Schedule(races, argOr(os.Args, 2, "current"))
	case "siralama", "drivers":
		s, err := client.GetDriverStandings(argOr(os.Args, 2, "current"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.DriverStandings(s, argOr(os.Args, 2, "current"))
	case "takim", "constructors":
		s, err := client.GetConstructorStandings(argOr(os.Args, 2, "current"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.ConstructorStandings(s, argOr(os.Args, 2, "current"))
	case "pit":
		p, race, err := client.GetPitStops(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.PitStops(p, race)
	case "quali", "qualifying":
		r, race, err := client.GetQualifying(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.Qualifying(r, race)
	case "grid":
		qr, race, err := client.GetQualifying(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		rr, _, err := client.GetRaceResult(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.Qualifying(qr, race)
		display.GridVsFinish(qr, rr, race)
	case "karsilastir", "compare":
		if len(os.Args) < 4 {
			display.Error("Kullanım: f1 karsilastir D1 D2 [sezon] [tur]")
			return
		}
		r, race, err := client.GetRaceResult(argOr(os.Args, 4, "current"), argOr(os.Args, 5, "last"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.DriverComparison(os.Args[2], os.Args[3], r, race)
	case "sezon", "season":
		races, err := client.GetScheduleWithResults(argOr(os.Args, 2, "current"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		drivers, _ := client.GetDriverStandings(argOr(os.Args, 2, "current"))
		constructors, _ := client.GetConstructorStandings(argOr(os.Args, 2, "current"))
		display.SeasonDashboard(races, drivers, constructors, argOr(os.Args, 2, "current"))
	case "tur", "lap":
		laps, err := client.GetLapTimes(argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"), argOr(os.Args, 4, "1"))
		if err != nil {
			display.Error(err.Error())
			return
		}
		display.LapTimes(laps, argOr(os.Args, 2, "current"), argOr(os.Args, 3, "last"))
	default:
		printHelp()
	}
}

func argOr(args []string, i int, fallback string) string {
	if i < len(args) {
		return args[i]
	}
	return fallback
}

func resolveDriverID(input string, results []models.RaceResult) string {
	input = strings.ToLower(input)
	for _, r := range results {
		if strings.ToLower(r.Driver.Code) == input ||
			strings.ToLower(r.Driver.DriverID) == input ||
			strings.ToLower(r.Driver.FamilyName) == input ||
			r.Number == input {
			return r.Driver.DriverID
		}
	}
	return ""
}

func getDriverName(input string, results []models.RaceResult) string {
	input = strings.ToLower(input)
	for _, r := range results {
		if strings.ToLower(r.Driver.Code) == input ||
			strings.ToLower(r.Driver.DriverID) == input ||
			strings.ToLower(r.Driver.FamilyName) == input ||
			r.Number == input {
			return r.Driver.GivenName + " " + r.Driver.FamilyName
		}
	}
	return input
}

func printHelp() {
	fmt.Printf("\n\033[1m\033[36m🏎  F1 Telemetri CLI\033[0m\n")
	fmt.Println(strings.Repeat("═", 55))
	fmt.Println("  f1.exe            → interaktif menü")
	fmt.Println("  f1.exe son        → son yarış")
	fmt.Println("  f1.exe sezon 2024 → sezon özeti")
	fmt.Println()
}
