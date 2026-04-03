package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

const baseURL = "https://api.jolpi.ca/ergast/f1"

type Client struct {
	http    *http.Client
	baseURL string
}

func NewClient() *Client {
	return &Client{
		http:    &http.Client{Timeout: 15 * time.Second},
		baseURL: baseURL,
	}
}

func (c *Client) fetch(url string) (*models.JolpiResponse, error) {
	resp, err := c.http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("istek hatası: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("yanıt okuma hatası: %w", err)
	}

	var result models.JolpiResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("JSON parse hatası: %w", err)
	}
	return &result, nil
}

// --- Takvim ---

func (c *Client) GetSchedule(season string) ([]models.Race, error) {
	url := fmt.Sprintf("%s/%s/races.json?limit=100", c.baseURL, season)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	return resp.MRData.RaceTable.Races, nil
}

// --- Sonuçlar ---

func (c *Client) GetRaceResult(season, round string) ([]models.RaceResult, *models.Race, error) {
	url := fmt.Sprintf("%s/%s/%s/results.json", c.baseURL, season, round)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, nil, err
	}
	if len(resp.MRData.RaceTable.Races) == 0 {
		return nil, nil, fmt.Errorf("bu tur için veri bulunamadı")
	}
	race := &resp.MRData.RaceTable.Races[0]
	return race.Results, race, nil
}

// --- Pit Stopları ---

func (c *Client) GetPitStops(season, round string) ([]models.PitStop, *models.Race, error) {
	url := fmt.Sprintf("%s/%s/%s/pitstops.json?limit=100", c.baseURL, season, round)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, nil, err
	}
	if len(resp.MRData.RaceTable.Races) == 0 {
		return nil, nil, fmt.Errorf(
			"pit stop verisi bulunamadı\n  💡 Jolpica API pit stop datasını yarıştan sonra pazartesi yükler\n     Geçmiş veri için dene: f1 pit 2024 1",
		)
	}
	race := &resp.MRData.RaceTable.Races[0]
	return race.PitStops, race, nil
}

// --- Tur Zamanları ---

func (c *Client) GetLapTimes(season, round, lap string) ([]models.Lap, error) {
	url := fmt.Sprintf("%s/%s/%s/laps/%s.json?limit=30", c.baseURL, season, round, lap)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	if len(resp.MRData.RaceTable.Races) == 0 {
		return nil, fmt.Errorf("tur verisi bulunamadı")
	}
	return resp.MRData.RaceTable.Races[0].Laps, nil
}

// --- Sürücü Puan Tablosu ---

func (c *Client) GetDriverStandings(season string) ([]models.DriverStanding, error) {
	url := fmt.Sprintf("%s/%s/driverstandings.json", c.baseURL, season)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	if len(resp.MRData.StandingsTable.StandingsLists) == 0 {
		return nil, fmt.Errorf("sıralaması verisi bulunamadı")
	}
	return resp.MRData.StandingsTable.StandingsLists[0].DriverStandings, nil
}

// --- Constructor Puan Tablosu ---

func (c *Client) GetConstructorStandings(season string) ([]models.ConstructorStanding, error) {
	url := fmt.Sprintf("%s/%s/constructorstandings.json", c.baseURL, season)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	if len(resp.MRData.StandingsTable.StandingsLists) == 0 {
		return nil, fmt.Errorf("constructor sıralaması bulunamadı")
	}
	return resp.MRData.StandingsTable.StandingsLists[0].ConstructorStandings, nil
}

// --- Qualifying ---

func (c *Client) GetQualifying(season, round string) ([]models.QualifyingResult, *models.Race, error) {
	url := fmt.Sprintf("%s/%s/%s/qualifying.json", c.baseURL, season, round)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, nil, err
	}
	if len(resp.MRData.RaceTable.Races) == 0 {
		return nil, nil, fmt.Errorf("qualifying verisi bulunamadı")
	}
	race := &resp.MRData.RaceTable.Races[0]
	return race.QualifyingResults, race, nil
}

// --- Son Yarış ---

func (c *Client) GetLastRaceResult() ([]models.RaceResult, *models.Race, error) {
	return c.GetRaceResult("current", "last")
}

// --- Sezon yarışlarını kazananlarıyla getir ---
func (c *Client) GetScheduleWithResults(season string) ([]models.Race, error) {
	url := fmt.Sprintf("%s/%s/results/1.json?limit=100", c.baseURL, season)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	// Kazanılan yarışları map'e al
	winMap := map[string]models.Race{}
	for _, r := range resp.MRData.RaceTable.Races {
		winMap[r.Round] = r
	}

	// Tam takvimi al
	allRaces, err := c.GetSchedule(season)
	if err != nil {
		return nil, err
	}

	// Birleştir
	for i, r := range allRaces {
		if won, ok := winMap[r.Round]; ok {
			allRaces[i].Results = won.Results
		}
	}
	return allRaces, nil
}

// Tüm tur zamanları (paginated)
func (c *Client) GetAllLapTimes(season, round string) ([]models.Lap, error) {
	url := fmt.Sprintf("%s/%s/%s/laps.json?limit=1500", c.baseURL, season, round)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	if len(resp.MRData.RaceTable.Races) == 0 {
		return nil, fmt.Errorf("tur verisi bulunamadı")
	}
	return resp.MRData.RaceTable.Races[0].Laps, nil
}

// Sürücünün tüm sezondaki sonuçları
func (c *Client) GetDriverSeasonResults(season, driverID string) ([]models.Race, error) {
	url := fmt.Sprintf("%s/%s/drivers/%s/results.json?limit=30", c.baseURL, season, driverID)
	resp, err := c.fetch(url)
	if err != nil {
		return nil, err
	}
	return resp.MRData.RaceTable.Races, nil
}

// İki sürücünün tüm sezondaki sonuçları
func (c *Client) GetTwoDriversSeasonResults(season, d1, d2 string) ([]models.Race, []models.Race, error) {
	r1, err := c.GetDriverSeasonResults(season, d1)
	if err != nil {
		return nil, nil, err
	}
	r2, err := c.GetDriverSeasonResults(season, d2)
	if err != nil {
		return nil, nil, err
	}
	return r1, r2, nil
}
