package models

// --- Genel API Wrapper ---

type MRData struct {
	Total     string `json:"total"`
	RaceTable RaceTable `json:"RaceTable"`
	StandingsTable StandingsTable `json:"StandingsTable"`
	DriverTable DriverTable `json:"DriverTable"`
}

type JolpiResponse struct {
	MRData MRData `json:"MRData"`
}

// --- Yarış & Sonuçlar ---

type RaceTable struct {
	Season string `json:"season"`
	Races  []Race `json:"Races"`
}

type Race struct {
	Season   string       `json:"season"`
	Round    string       `json:"round"`
	RaceName string       `json:"raceName"`
	Date     string       `json:"date"`
	Time     string       `json:"time"`
	Circuit  Circuit      `json:"Circuit"`
	Results  []RaceResult `json:"Results,omitempty"`
	PitStops []PitStop    `json:"PitStops,omitempty"`
	Laps     []Lap        `json:"Laps,omitempty"`
	QualifyingResults []QualifyingResult `json:"QualifyingResults,omitempty"`
}

type Circuit struct {
	CircuitID   string   `json:"circuitId"`
	CircuitName string   `json:"circuitName"`
	Location    Location `json:"Location"`
}

type Location struct {
	Lat      string `json:"lat"`
	Long     string `json:"long"`
	Locality string `json:"locality"`
	Country  string `json:"country"`
}

type RaceResult struct {
	Number   string      `json:"number"`
	Position string      `json:"position"`
	Points   string      `json:"points"`
	Driver   Driver      `json:"Driver"`
	Constructor Constructor `json:"Constructor"`
	Grid     string      `json:"grid"`
	Laps     string      `json:"laps"`
	Status   string      `json:"status"`
	Time     *ResultTime `json:"Time,omitempty"`
	FastestLap *FastestLap `json:"FastestLap,omitempty"`
}

type ResultTime struct {
	Millis string `json:"millis"`
	Time   string `json:"time"`
}

type FastestLap struct {
	Rank        string     `json:"rank"`
	Lap         string     `json:"lap"`
	Time        LapTime    `json:"Time"`
	AverageSpeed AverageSpeed `json:"AverageSpeed"`
}

type LapTime struct {
	Time string `json:"time"`
}

type AverageSpeed struct {
	Units string `json:"units"`
	Speed string `json:"speed"`
}

// --- Pit Stop ---

type PitStop struct {
	DriverID string `json:"driverId"`
	Lap      string `json:"lap"`
	Stop     string `json:"stop"`
	Time     string `json:"time"`
	Duration string `json:"duration"`
}

// --- Tur Zamanları ---

type Lap struct {
	Number   string    `json:"number"`
	Timings  []Timing  `json:"Timings"`
}

type Timing struct {
	DriverID string `json:"driverId"`
	Position string `json:"position"`
	Time     string `json:"time"`
}

// --- Sürücü & Constructor ---

type Driver struct {
	DriverID        string `json:"driverId"`
	PermanentNumber string `json:"permanentNumber"`
	Code            string `json:"code"`
	GivenName       string `json:"givenName"`
	FamilyName      string `json:"familyName"`
	Nationality     string `json:"nationality"`
}

type Constructor struct {
	ConstructorID string `json:"constructorId"`
	Name          string `json:"name"`
	Nationality   string `json:"nationality"`
}

// --- Puan Tabloları ---

type StandingsTable struct {
	Season         string           `json:"season"`
	StandingsLists []StandingsList  `json:"StandingsLists"`
}

type StandingsList struct {
	Season             string              `json:"season"`
	Round              string              `json:"round"`
	DriverStandings    []DriverStanding    `json:"DriverStandings,omitempty"`
	ConstructorStandings []ConstructorStanding `json:"ConstructorStandings,omitempty"`
}

type DriverStanding struct {
	Position  string      `json:"position"`
	Points    string      `json:"points"`
	Wins      string      `json:"wins"`
	Driver    Driver      `json:"Driver"`
	Constructors []Constructor `json:"Constructors"`
}

type ConstructorStanding struct {
	Position    string      `json:"position"`
	Points      string      `json:"points"`
	Wins        string      `json:"wins"`
	Constructor Constructor `json:"Constructor"`
}

// --- Sürücü Listesi ---

type DriverTable struct {
	Drivers []Driver `json:"Drivers"`
}

// --- Qualifying ---

type QualifyingResult struct {
	Number   string      `json:"number"`
	Position string      `json:"position"`
	Driver   Driver      `json:"Driver"`
	Constructor Constructor `json:"Constructor"`
	Q1       string      `json:"Q1,omitempty"`
	Q2       string      `json:"Q2,omitempty"`
	Q3       string      `json:"Q3,omitempty"`
}
