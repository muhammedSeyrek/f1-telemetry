package live

import (
	"fmt"
	"os"
	"os/signal"
	"sort"
	"syscall"
	"time"

	"github.com/muhammedSeyrek/f1-telemetry/internal/api"
	"github.com/muhammedSeyrek/f1-telemetry/internal/display"
	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

// Terminali temizle
func clearScreen() {
	fmt.Print("\033[H\033[2J")
}

// CTRL+C yakalamak için
func waitForExit() chan os.Signal {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	return c
}

// ─────────────────────────────────────────────
// TİMİNG TOWER — her 4 saniyede güncellenir
// ─────────────────────────────────────────────

func TimingTower(client *api.LiveClient, session *models.LiveSession) {
	fmt.Printf("\n\033[36m⏳ Timing Tower başlatılıyor... (CTRL+C ile çık)\033[0m\n")
	time.Sleep(1 * time.Second)

	exit := waitForExit()

	for {
		select {
		case <-exit:
			fmt.Println("\n\033[33m👋 Timing Tower kapatıldı.\033[0m")
			return
		default:
		}

		drivers, err := client.GetDrivers(session.SessionKey)
		if err != nil {
			display.Error("Sürücü verisi alınamadı: " + err.Error())
			time.Sleep(5 * time.Second)
			continue
		}

		// Sürücü map
		driverMap := map[int]models.LiveDriver{}
		for _, d := range drivers {
			driverMap[d.DriverNumber] = d
		}

		positions, err := client.GetLatestPositions(session.SessionKey)
		if err != nil {
			display.Error("Pozisyon verisi alınamadı")
			time.Sleep(5 * time.Second)
			continue
		}

		intervals, _ := client.GetIntervals(session.SessionKey)
		laps, _ := client.GetLatestLaps(session.SessionKey)
		stints, _ := client.GetStints(session.SessionKey)
		weather, _ := client.GetWeather(session.SessionKey)

		// Pozisyona göre sırala
		type row struct {
			pos int
			num int
		}
		var sorted []row
		for num, p := range positions {
			sorted = append(sorted, row{p.Position, num})
		}
		sort.Slice(sorted, func(i, j int) bool {
			return sorted[i].pos < sorted[j].pos
		})

		clearScreen()

		// Header
		fmt.Printf("\033[1m\033[36m🏎  %s — %s\033[0m\n", session.CountryName, session.SessionName)
		fmt.Println("\033[36m" + repeat("═", 75) + "\033[0m")

		// Hava
		if weather != nil {
			rain := ""
			if weather.Rainfall > 0 {
				rain = " 🌧"
			}
			fmt.Printf("\033[90m🌡  Hava: %.1f°C  |  Pist: %.1f°C  |  Nem: %.0f%%  |  Rüzgar: %.1f m/s%s\033[0m\n\n",
				weather.AirTemp, weather.TrackTemp, weather.Humidity, weather.WindSpeed, rain)
		}

		// Tablo başlığı
		fmt.Printf("%-4s %-5s %-22s %-18s %-10s %-10s %-8s %s\n",
			"Pos", "No", "Sürücü", "Takım", "Aralık", "Lider Farkı", "Son Tur", "Lastik")
		fmt.Println(repeat("─", 95))

		for _, r := range sorted {
			d := driverMap[r.num]
			iv := intervals[r.num]
			lap := laps[r.num]
			stint := stints[r.num]

			// Renk
			color := "\033[0m"
			switch r.pos {
			case 1:
				color = "\033[1m\033[33m"
			case 2, 3:
				color = "\033[1m"
			}

			// Aralık
			gapStr := "-"
			leaderStr := "-"
			if r.pos == 1 {
				gapStr = "LIDER"
				leaderStr = "-"
			} else {
				if iv.Interval != 0 {
					gapStr = fmt.Sprintf("+%.3f", iv.Interval)
				}
				if iv.GapToLeader != 0 {
					leaderStr = fmt.Sprintf("+%.3f", iv.GapToLeader)
				}
			}

			// Son tur
			lapStr := "-"
			if lap.LapDuration > 0 {
				m := int(lap.LapDuration) / 60
				s := lap.LapDuration - float64(m*60)
				lapStr = fmt.Sprintf("%d:%06.3f", m, s)
			}

			// Lastik
			compound := "-"
			if stint.Compound != "" {
				compound = compoundIcon(stint.Compound)
			}

			fmt.Printf("%s%-4d %-5d %-22s %-18s %-10s %-10s %-8s %s\033[0m\n",
				color,
				r.pos, r.num,
				d.NameAcronym+" "+shortName(d.FullName),
				shortTeam(d.TeamName),
				gapStr, leaderStr, lapStr, compound,
			)
		}

		fmt.Printf("\n\033[90m⟳ Son güncelleme: %s  |  CTRL+C ile çık\033[0m\n",
			time.Now().Format("15:04:05"))

		time.Sleep(4 * time.Second)
	}
}

// ─────────────────────────────────────────────
// RACE CONTROL — anlık mesajlar
// ─────────────────────────────────────────────

func RaceControlFeed(client *api.LiveClient, session *models.LiveSession) {
	fmt.Printf("\n\033[36m📻 Race Control Feed başlatılıyor... (CTRL+C ile çık)\033[0m\n")
	time.Sleep(1 * time.Second)

	exit := waitForExit()
	seen := map[string]bool{}
	first := true

	for {
		select {
		case <-exit:
			fmt.Println("\n\033[33m👋 Race Control kapatıldı.\033[0m")
			return
		default:
		}

		msgs, err := client.GetRaceControl(session.SessionKey)
		if err != nil {
			time.Sleep(5 * time.Second)
			continue
		}

		if first {
			clearScreen()
			fmt.Printf("\033[1m\033[36m📻 Race Control — %s %s\033[0m\n", session.CountryName, session.SessionName)
			fmt.Println("\033[36m" + repeat("═", 65) + "\033[0m")
			// Son 10 mesajı göster
			start := 0
			if len(msgs) > 10 {
				start = len(msgs) - 10
			}
			for _, m := range msgs[start:] {
				printRaceControlMsg(m)
				seen[m.Date+m.Message] = true
			}
			first = false
		} else {
			// Sadece yenileri göster
			for _, m := range msgs {
				key := m.Date + m.Message
				if !seen[key] {
					printRaceControlMsg(m)
					seen[key] = true
				}
			}
		}

		fmt.Printf("\033[90m⟳ %s\033[0m\r", time.Now().Format("15:04:05"))
		time.Sleep(3 * time.Second)
	}
}

func printRaceControlMsg(m models.RaceControlMsg) {
	color := "\033[0m"
	icon := "📢"

	switch m.Flag {
	case "RED":
		color = "\033[1m\033[31m"
		icon = "🔴"
	case "YELLOW", "DOUBLE YELLOW":
		color = "\033[1m\033[33m"
		icon = "🟡"
	case "GREEN":
		color = "\033[1m\033[32m"
		icon = "🟢"
	case "CHEQUERED":
		color = "\033[1m\033[37m"
		icon = "🏁"
	case "BLUE":
		color = "\033[34m"
		icon = "🔵"
	}

	if m.Category == "SafetyCar" {
		color = "\033[1m\033[33m"
		icon = "🚗"
	}

	lap := ""
	if m.Lap > 0 {
		lap = fmt.Sprintf("[Tur %2d] ", m.Lap)
	}

	t := ""
	if len(m.Date) >= 19 {
		t = m.Date[11:19]
	}

	fmt.Printf("%s%s %s %s%s\033[0m\n", color, icon, t, lap, m.Message)
}

// ─────────────────────────────────────────────
// PİT TAKIP
// ─────────────────────────────────────────────

func PitTracker(client *api.LiveClient, session *models.LiveSession) {
	fmt.Printf("\n\033[36m🔧 Pit Takip başlatılıyor... (CTRL+C ile çık)\033[0m\n")
	time.Sleep(1 * time.Second)

	exit := waitForExit()

	for {
		select {
		case <-exit:
			fmt.Println("\n\033[33m👋 Pit Takip kapatıldı.\033[0m")
			return
		default:
		}

		drivers, _ := client.GetDrivers(session.SessionKey)
		dMap := map[int]models.LiveDriver{}
		for _, d := range drivers {
			dMap[d.DriverNumber] = d
		}

		pits, err := client.GetLivePitStops(session.SessionKey)
		if err != nil {
			time.Sleep(5 * time.Second)
			continue
		}

		stints, _ := client.GetStints(session.SessionKey)
		positions, _ := client.GetLatestPositions(session.SessionKey)

		clearScreen()
		fmt.Printf("\033[1m\033[36m🔧 Pit Stop Takip — %s %s\033[0m\n", session.CountryName, session.SessionName)
		fmt.Println("\033[36m" + repeat("═", 70) + "\033[0m")

		// Sürücü bazında pit özetle
		type pitSummary struct {
			driver   models.LiveDriver
			stops    []models.LivePitStop
			stint    models.LiveStint
			position int
		}

		summaries := map[int]*pitSummary{}
		for _, p := range pits {
			if _, ok := summaries[p.DriverNumber]; !ok {
				summaries[p.DriverNumber] = &pitSummary{
					driver:   dMap[p.DriverNumber],
					position: 99,
				}
				if pos, ok := positions[p.DriverNumber]; ok {
					summaries[p.DriverNumber].position = pos.Position
				}
				if s, ok := stints[p.DriverNumber]; ok {
					summaries[p.DriverNumber].stint = s
				}
			}
			summaries[p.DriverNumber].stops = append(summaries[p.DriverNumber].stops, p)
		}

		// Sırala
		var sums []*pitSummary
		for _, s := range summaries {
			sums = append(sums, s)
		}
		sort.Slice(sums, func(i, j int) bool {
			return sums[i].position < sums[j].position
		})

		fmt.Printf("%-4s %-22s %-18s %-8s %-10s %-8s %s\n",
			"Pos", "Sürücü", "Takım", "Stop#", "Son Süre", "Lastik", "Turlar")
		fmt.Println(repeat("─", 85))

		for _, s := range sums {
			lastPit := s.stops[len(s.stops)-1]
			durStr := "-"
			if lastPit.PitDuration > 0 {
				durStr = fmt.Sprintf("%.3fs", lastPit.PitDuration)
			}

			compound := compoundIcon(s.stint.Compound)

			lapNums := []string{}
			for _, p := range s.stops {
				lapNums = append(lapNums, fmt.Sprintf("%d", p.LapNumber))
			}

			fmt.Printf("%-4d %-22s %-18s %-8d %-10s %-8s %s\n",
				s.position,
				s.driver.NameAcronym+" "+shortName(s.driver.FullName),
				shortTeam(s.driver.TeamName),
				len(s.stops),
				durStr,
				compound,
				joinStr(lapNums, ", "),
			)
		}

		fmt.Printf("\n\033[90m⟳ %s  |  CTRL+C ile çık\033[0m\n", time.Now().Format("15:04:05"))
		time.Sleep(5 * time.Second)
	}
}

// ─────────────────────────────────────────────
// ARAÇ VERİSİ — 2 sürücü throttle/fren karşılaştırması
// ─────────────────────────────────────────────

func CarComparison(client *api.LiveClient, session *models.LiveSession, code1, code2 string) {
	fmt.Printf("\n\033[36m📊 Araç Karşılaştırması başlatılıyor... (CTRL+C ile çık)\033[0m\n")
	time.Sleep(1 * time.Second)

	// Sürücü numaralarını bul
	drivers, err := client.GetDrivers(session.SessionKey)
	if err != nil {
		display.Error("Sürücü verisi alınamadı")
		return
	}

	num1, num2 := -1, -1
	var d1, d2 models.LiveDriver
	for _, d := range drivers {
		if d.NameAcronym == code1 || d.FullName == code1 {
			num1 = d.DriverNumber
			d1 = d
		}
		if d.NameAcronym == code2 || d.FullName == code2 {
			num2 = d.DriverNumber
			d2 = d
		}
	}

	if num1 == -1 || num2 == -1 {
		display.Error(fmt.Sprintf("Sürücü bulunamadı: %s veya %s", code1, code2))
		return
	}

	exit := waitForExit()

	for {
		select {
		case <-exit:
			fmt.Println("\n\033[33m👋 Karşılaştırma kapatıldı.\033[0m")
			return
		default:
		}

		car1, _ := client.GetLatestCarData(session.SessionKey, num1)
		car2, _ := client.GetLatestCarData(session.SessionKey, num2)

		clearScreen()
		fmt.Printf("\033[1m\033[36m📊 Araç Verisi — %s %s\033[0m\n", session.CountryName, session.SessionName)
		fmt.Println("\033[36m" + repeat("═", 65) + "\033[0m")

		name1 := d1.NameAcronym + " " + shortName(d1.FullName)
		name2 := d2.NameAcronym + " " + shortName(d2.FullName)

		fmt.Printf("\n%-30s %-15s %s\n", name1, "VERİ", name2)
		fmt.Println(repeat("─", 65))

		if car1 != nil && car2 != nil {
			printCarRow("Hız (km/h)", fmt.Sprintf("%d", car1.Speed), fmt.Sprintf("%d", car2.Speed), false)
			printCarRow("RPM", fmt.Sprintf("%d", car1.RPM), fmt.Sprintf("%d", car2.RPM), false)
			printCarRow("Vites", fmt.Sprintf("%d", car1.NGear), fmt.Sprintf("%d", car2.NGear), false)
			printCarRow("Throttle (%)", fmt.Sprintf("%d", car1.Throttle), fmt.Sprintf("%d", car2.Throttle), false)
			printCarRow("Fren", brakeStr(car1.Brake), brakeStr(car2.Brake), false)
			printCarRow("DRS", drsStr(car1.DRS), drsStr(car2.DRS), false)

			// Throttle bar
			fmt.Println()
			fmt.Printf("Throttle: %s %s\n", name1, barChart(car1.Throttle, 100, 30, "\033[32m"))
			fmt.Printf("Throttle: %s %s\n", name2, barChart(car2.Throttle, 100, 30, "\033[32m"))
			fmt.Printf("Fren:     %s %s\n", name1, barChart(car1.Brake, 1, 30, "\033[31m"))
			fmt.Printf("Fren:     %s %s\n", name2, barChart(car2.Brake, 1, 30, "\033[31m"))
		} else {
			fmt.Println("\033[90m  Araç verisi bekleniyor...\033[0m")
		}

		fmt.Printf("\n\033[90m⟳ %s  |  CTRL+C ile çık\033[0m\n", time.Now().Format("15:04:05"))
		time.Sleep(2 * time.Second)
	}
}

// ─────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────

func repeat(s string, n int) string {
	result := ""
	for i := 0; i < n; i++ {
		result += s
	}
	return result
}

func shortName(full string) string {
	if len(full) > 12 {
		return full[:12]
	}
	return full
}

func shortTeam(t string) string {
	teams := map[string]string{
		"Mercedes":        "Mercedes",
		"Red Bull Racing": "Red Bull",
		"Ferrari":         "Ferrari",
		"McLaren":         "McLaren",
		"Aston Martin":    "Aston Martin",
		"Alpine":          "Alpine",
		"Williams":        "Williams",
		"RB":              "RB",
		"Haas F1 Team":    "Haas",
		"Kick Sauber":     "Sauber",
	}
	for k, v := range teams {
		if t == k {
			return v
		}
	}
	if len(t) > 14 {
		return t[:14]
	}
	return t
}

func compoundIcon(c string) string {
	switch c {
	case "SOFT":
		return "🔴 SOFT"
	case "MEDIUM":
		return "🟡 MED"
	case "HARD":
		return "⚪ HARD"
	case "INTERMEDIATE":
		return "🟢 INT"
	case "WET":
		return "🔵 WET"
	}
	return c
}

func brakeStr(b int) string {
	if b > 0 {
		return "\033[31m● FREN\033[0m"
	}
	return "○"
}

func drsStr(d int) string {
	if d == 10 || d == 12 || d == 14 {
		return "\033[32m✓ AÇIK\033[0m"
	}
	return "✗ Kapalı"
}

func barChart(val, max, width int, color string) string {
	pct := float64(val) / float64(max)
	if pct > 1 {
		pct = 1
	}
	filled := int(pct * float64(width))
	bar := color
	for i := 0; i < filled; i++ {
		bar += "█"
	}
	bar += "\033[90m"
	for i := filled; i < width; i++ {
		bar += "░"
	}
	bar += fmt.Sprintf("\033[0m %d%%", val)
	return bar
}

func printCarRow(label, v1, v2 string, lowerBetter bool) {
	fmt.Printf("%-30s %-15s %s\n", v1, label, v2)
}

func joinStr(ss []string, sep string) string {
	result := ""
	for i, s := range ss {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}
