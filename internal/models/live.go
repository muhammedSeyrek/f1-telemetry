package models

// --- OpenF1 Canlı Modeller ---

type LiveDriver struct {
	DriverNumber int    `json:"driver_number"`
	FullName     string `json:"full_name"`
	NameAcronym  string `json:"name_acronym"`
	TeamName     string `json:"team_name"`
	TeamColour   string `json:"team_colour"`
}

type LivePosition struct {
	DriverNumber int    `json:"driver_number"`
	Position     int    `json:"position"`
	Date         string `json:"date"`
}

type LiveInterval struct {
	DriverNumber int     `json:"driver_number"`
	GapToLeader  float64 `json:"gap_to_leader"`
	Interval     float64 `json:"interval"`
	Date         string  `json:"date"`
}

type LiveLap struct {
	DriverNumber int     `json:"driver_number"`
	LapNumber    int     `json:"lap_number"`
	LapDuration  float64 `json:"lap_duration"`
	Sector1      float64 `json:"duration_sector_1"`
	Sector2      float64 `json:"duration_sector_2"`
	Sector3      float64 `json:"duration_sector_3"`
	IsPitOutLap  bool    `json:"is_pit_out_lap"`
	Date         string  `json:"date_start"`
}

type LiveCarData struct {
	DriverNumber int    `json:"driver_number"`
	RPM          int    `json:"rpm"`
	Speed        int    `json:"speed"`
	NGear        int    `json:"n_gear"`
	Throttle     int    `json:"throttle"`
	Brake        int    `json:"brake"`
	DRS          int    `json:"drs"`
	Date         string `json:"date"`
}

type LivePitStop struct {
	DriverNumber int     `json:"driver_number"`
	LapNumber    int     `json:"lap_number"`
	PitDuration  float64 `json:"pit_duration"`
	Date         string  `json:"date"`
}

type LiveStint struct {
	DriverNumber   int    `json:"driver_number"`
	StintNumber    int    `json:"stint_number"`
	Compound       string `json:"compound"`
	LapStart       int    `json:"lap_start"`
	LapEnd         int    `json:"lap_end"`
	TyreAgeAtStart int    `json:"tyre_age_at_start"`
}

type RaceControlMsg struct {
	Date     string `json:"date"`
	Lap      int    `json:"lap_number"`
	Category string `json:"category"`
	Message  string `json:"message"`
	Flag     string `json:"flag"`
}

type LiveWeather struct {
	AirTemp   float64 `json:"air_temperature"`
	TrackTemp float64 `json:"track_temperature"`
	Humidity  float64 `json:"humidity"`
	WindSpeed float64 `json:"wind_speed"`
	WindDir   int     `json:"wind_direction"`
	Rainfall  int     `json:"rainfall"`
	Date      string  `json:"date"`
}

type LiveSession struct {
	SessionKey  int    `json:"session_key"`
	SessionName string `json:"session_name"`
	SessionType string `json:"session_type"`
	MeetingKey  int    `json:"meeting_key"`
	CountryName string `json:"country_name"`
	Location    string `json:"location"`
	DateStart   string `json:"date_start"`
	DateEnd     string `json:"date_end"`
	Year        int    `json:"year"`
}
