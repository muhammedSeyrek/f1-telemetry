package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/muhammedSeyrek/f1-telemetry/internal/models"
)

const openF1Base = "https://api.openf1.org/v1"

type LiveClient struct {
	http       *http.Client
	SessionKey string
}

func NewLiveClient() *LiveClient {
	return &LiveClient{
		http:       &http.Client{Timeout: 10 * time.Second},
		SessionKey: "latest",
	}
}

func (c *LiveClient) fetchLive(endpoint string) ([]byte, error) {
	url := fmt.Sprintf("%s/%s", openF1Base, endpoint)
	resp, err := c.http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("bağlantı hatası: %w", err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// --- Oturum ---

func (c *LiveClient) GetLatestSession() (*models.LiveSession, error) {
	body, err := c.fetchLive("sessions?session_key=latest")
	if err != nil {
		return nil, err
	}
	var sessions []models.LiveSession
	if err := json.Unmarshal(body, &sessions); err != nil {
		return nil, err
	}
	if len(sessions) == 0 {
		return nil, fmt.Errorf("aktif oturum bulunamadı")
	}
	return &sessions[len(sessions)-1], nil
}

func (c *LiveClient) GetSession(year, round, sessionType string) (*models.LiveSession, error) {
	body, err := c.fetchLive(fmt.Sprintf("sessions?year=%s&session_name=%s", year, sessionType))
	if err != nil {
		return nil, err
	}
	var sessions []models.LiveSession
	if err := json.Unmarshal(body, &sessions); err != nil {
		return nil, err
	}
	if len(sessions) == 0 {
		return nil, fmt.Errorf("oturum bulunamadı")
	}
	return &sessions[len(sessions)-1], nil
}

// --- Sürücüler ---

func (c *LiveClient) GetDrivers(sessionKey int) ([]models.LiveDriver, error) {
	body, err := c.fetchLive(fmt.Sprintf("drivers?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var drivers []models.LiveDriver
	return drivers, json.Unmarshal(body, &drivers)
}

// --- Pozisyonlar ---

func (c *LiveClient) GetPositions(sessionKey int) ([]models.LivePosition, error) {
	body, err := c.fetchLive(fmt.Sprintf("position?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var positions []models.LivePosition
	return positions, json.Unmarshal(body, &positions)
}

// Her sürücünün son pozisyonunu döner
func (c *LiveClient) GetLatestPositions(sessionKey int) (map[int]models.LivePosition, error) {
	all, err := c.GetPositions(sessionKey)
	if err != nil {
		return nil, err
	}
	latest := map[int]models.LivePosition{}
	for _, p := range all {
		if existing, ok := latest[p.DriverNumber]; !ok || p.Date > existing.Date {
			latest[p.DriverNumber] = p
		}
	}
	return latest, nil
}

// --- Aralıklar ---

func (c *LiveClient) GetIntervals(sessionKey int) (map[int]models.LiveInterval, error) {
	body, err := c.fetchLive(fmt.Sprintf("intervals?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var all []models.LiveInterval
	if err := json.Unmarshal(body, &all); err != nil {
		return nil, err
	}
	latest := map[int]models.LiveInterval{}
	for _, iv := range all {
		if existing, ok := latest[iv.DriverNumber]; !ok || iv.Date > existing.Date {
			latest[iv.DriverNumber] = iv
		}
	}
	return latest, nil
}

// --- Tur Zamanları ---

func (c *LiveClient) GetLatestLaps(sessionKey int) (map[int]models.LiveLap, error) {
	body, err := c.fetchLive(fmt.Sprintf("laps?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var all []models.LiveLap
	if err := json.Unmarshal(body, &all); err != nil {
		return nil, err
	}
	latest := map[int]models.LiveLap{}
	for _, l := range all {
		if existing, ok := latest[l.DriverNumber]; !ok || l.LapNumber > existing.LapNumber {
			latest[l.DriverNumber] = l
		}
	}
	return latest, nil
}

// --- Araç Verisi (Throttle, Fren, DRS...) ---

func (c *LiveClient) GetCarData(sessionKey, driverNumber int) ([]models.LiveCarData, error) {
	body, err := c.fetchLive(fmt.Sprintf(
		"car_data?session_key=%d&driver_number=%d", sessionKey, driverNumber))
	if err != nil {
		return nil, err
	}
	var data []models.LiveCarData
	return data, json.Unmarshal(body, &data)
}

func (c *LiveClient) GetLatestCarData(sessionKey, driverNumber int) (*models.LiveCarData, error) {
	data, err := c.GetCarData(sessionKey, driverNumber)
	if err != nil || len(data) == 0 {
		return nil, err
	}
	return &data[len(data)-1], nil
}

// --- Pit Stopları ---

func (c *LiveClient) GetLivePitStops(sessionKey int) ([]models.LivePitStop, error) {
	body, err := c.fetchLive(fmt.Sprintf("pit?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var pits []models.LivePitStop
	return pits, json.Unmarshal(body, &pits)
}

// --- Stintler (lastik) ---

func (c *LiveClient) GetStints(sessionKey int) (map[int]models.LiveStint, error) {
	body, err := c.fetchLive(fmt.Sprintf("stints?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var all []models.LiveStint
	if err := json.Unmarshal(body, &all); err != nil {
		return nil, err
	}
	// Her sürücünün güncel stinti
	latest := map[int]models.LiveStint{}
	for _, s := range all {
		if existing, ok := latest[s.DriverNumber]; !ok || s.StintNumber > existing.StintNumber {
			latest[s.DriverNumber] = s
		}
	}
	return latest, nil
}

// --- Tüm Stintler (gruplamadan) ---

func (c *LiveClient) GetAllStints(sessionKey int) ([]models.LiveStint, error) {
	body, err := c.fetchLive(fmt.Sprintf("stints?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var stints []models.LiveStint
	return stints, json.Unmarshal(body, &stints)
}

// --- Tüm Tur Zamanları (gruplamadan) ---

func (c *LiveClient) GetAllLaps(sessionKey int) ([]models.LiveLap, error) {
	body, err := c.fetchLive(fmt.Sprintf("laps?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var laps []models.LiveLap
	return laps, json.Unmarshal(body, &laps)
}

// --- Race Control ---

func (c *LiveClient) GetRaceControl(sessionKey int) ([]models.RaceControlMsg, error) {
	body, err := c.fetchLive(fmt.Sprintf("race_control?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var msgs []models.RaceControlMsg
	return msgs, json.Unmarshal(body, &msgs)
}

// --- Hava Durumu ---

func (c *LiveClient) GetWeather(sessionKey int) (*models.LiveWeather, error) {
	body, err := c.fetchLive(fmt.Sprintf("weather?session_key=%d", sessionKey))
	if err != nil {
		return nil, err
	}
	var all []models.LiveWeather
	if err := json.Unmarshal(body, &all); err != nil || len(all) == 0 {
		return nil, err
	}
	return &all[len(all)-1], nil
}
