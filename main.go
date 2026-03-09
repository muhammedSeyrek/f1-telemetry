package main

type F1Response struct {
	MRData struct {
		StandingsTable struct {
			StandingsLists []struct {
				DriverStandings []struct {
					Position string `json:"position"`
					Points   string `json:"points"`
					Driver   struct {
						FamilyName string `json:"familyName"`
						Code       string `json:"code"`
					} `json:"Driver"`
					Constructors []struct {
						Name string `json:"name"`
					} `json:"Constructors"`
				} `json:"DriverStandings"`
			} `json:"StandingsLists"`
		} `json:"StandingsTable"`
	} `json:"MRData"`
}

func getDriverStandings() (*F1Response, error) {

}
