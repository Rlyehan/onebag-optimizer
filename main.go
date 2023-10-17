package main

import (
	"bytes"
	"encoding/json"
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	chartrender "github.com/go-echarts/go-echarts/v2/render"
	"html/template"
	"log"
	"net/http"
	"sort"
	"os"
	"fmt"
	"sync"
	"time"
	"crypto/rand"
	"encoding/base64"
)

type TravelItem struct {
	Name        string `json:"itemName"`
	Amount      int    `json:"itemAmount"`
	Weight      int    `json:"itemWeight"`
	Category    string `json:"itemCategory"`
	Subcategory string `json:"itemSubcategory"`
	Priority    string `json:"itemPriority"`
	BagType     string `json:"itemBagType"`
}

type AnalysisResult struct {
	TotalWeight      int
	TopHeaviestItems []TravelItem
	BagWeights       map[string]int
	CategoryWeights  map[string]int
	PriorityWeights  map[string]int
	AverageWeight    int
	CategoryWeightPercentage map[string]float64
}

type CategoryWeight struct {
	Category string
	Weight   int
}

type Session struct {
	ID string
	LastAccess time.Time
	Values map[string]interface{}
}

type SessionManager struct {
	sessions map[string]*Session
	mutex sync.Mutex
	expiry time.Duration
}

func NewSessionManager(expiry time.Duration) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		expiry: expiry,
	}
}

func generateSessionID() (string, error) {
    b := make([]byte, 32)
    _, err := rand.Read(b)
    if err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}

func (sm *SessionManager) CreateSession() (*Session, error) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	sessionID, err := generateSessionID()
    if err != nil {
        return nil, err
    }

	session := &Session{
		ID: sessionID,
		LastAccess: time.Now(),
		Values: make(map[string]interface{}),
	}
	sm.sessions[session.ID] = session
	return session, nil
} 

func (sm *SessionManager) GetSession(sessionID string) (*Session, bool) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()

	session, found := sm.sessions[sessionID]
	if !found {
		return nil, false
	}

	session.LastAccess = time.Now()
	return session, true
}

func (sm *SessionManager) Cleanup() {
    sm.mutex.Lock()
    defer sm.mutex.Unlock()

    for id, session := range sm.sessions {
        if time.Since(session.LastAccess) > sm.expiry {
            delete(sm.sessions, id)
        }
    }
}

func sessionMiddleware(next http.HandlerFunc, sm *SessionManager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie("session_id")
		if err != nil || sessionCookie.Value == "" {
			session, err := sm.CreateSession()
			if err != nil {
				// Handle the error here. For example, you might log the error and return a 500 status.
				log.Printf("Failed to create session: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			http.SetCookie(w, &http.Cookie{
				Name:    "session_id",
				Value:   session.ID,
				Expires: time.Now().Add(sm.expiry),
			})
		} else {
			_, exists := sm.GetSession(sessionCookie.Value)
			if !exists {
				session, err := sm.CreateSession()
				if err != nil {
					// Handle the error here. For example, you might log the error and return a 500 status.
					log.Printf("Failed to create session: %v", err)
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					return
				}
				http.SetCookie(w, &http.Cookie{
					Name:    "session_id",
					Value:   session.ID,
					Expires: time.Now().Add(sm.expiry),
				})
			}
		}
		next.ServeHTTP(w, r)
	}
}

func main() {
	sessionManager := NewSessionManager(12 * time.Hour)
    logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
    if err != nil {
        log.Fatalf("Failed to open log file: %v", err)
    }
    defer logFile.Close()

    log.SetOutput(logFile)

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	go func() {
        for {
            time.Sleep(1 * time.Hour)
            sessionManager.Cleanup()
        }
    }()

	http.HandleFunc("/", sessionMiddleware(rootHandler, sessionManager))
	http.HandleFunc("/process", sessionMiddleware(processHandler, sessionManager))
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
    	log.Fatalf("Failed to start server: %v", err)
	}
}

func handleError(w http.ResponseWriter, statusCode int, err error, logMessage string) {
    log.Printf("%s: %s", logMessage, err)
    http.Error(w, http.StatusText(statusCode), statusCode)
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
        handleError(w, http.StatusInternalServerError, err, "Failed to load template")
        return
	}
	if err = tmpl.Execute(w, nil); err != nil {
        handleError(w, http.StatusInternalServerError, err, "Error executing template")
		return
    }
}

func processHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		handleError(w, http.StatusMethodNotAllowed, fmt.Errorf("Method not allowed"), "Only POST method is allowed")
		return
	}

	var items []TravelItem
	err := json.NewDecoder(r.Body).Decode(&items)
	if err != nil {
		handleError(w, http.StatusBadRequest, err, "Error decoding JSON")
		return
	}

	for _, item := range items {
		if !isValidTravelItem(item) {
			handleError(w, http.StatusUnprocessableEntity, fmt.Errorf("Invalid travel item data"), "Invalid travel item data")
			return
		}
	}

	results := dataProcessing(items)

	var categoryWeights []CategoryWeight
	for category, weight := range results.CategoryWeights {
		categoryWeights = append(categoryWeights, CategoryWeight{
			Category: category,
			Weight:   weight,
		})
	}
	chart, err := categoryWeightPieChart(categoryWeights)
	if err != nil {
		handleError(w, http.StatusInternalServerError, err, "Failed to generate the pie chart")
		return
	}

	data := struct {
		Analysis AnalysisResult
		Chart    template.HTML
	}{
		Analysis: results,
		Chart:    chart,
	}

	tmpl, err := template.ParseFiles("./templates/analysis.html")
	if err != nil {
		handleError(w, http.StatusInternalServerError, err, "Could not load template")
		return
	}

	err = tmpl.Execute(w, data)
	if err != nil {
		handleError(w, http.StatusInternalServerError, err, "Error executing template")
	}
}

func dataProcessing(items []TravelItem) AnalysisResult {
	totalWeight := 0
	bagWeights := make(map[string]int)
	categoryWeights := make(map[string]int)
	priorityWeights := make(map[string]int)

	for _, item := range items {
		itemWeightInt := item.Weight
		itemAmountInt := item.Amount
		itemTotalWeight := itemWeightInt * itemAmountInt
		totalWeight += itemTotalWeight
		bagWeights[item.BagType] += itemTotalWeight
		priorityWeights[item.Priority] += itemTotalWeight
		categoryWeights[item.Category] += itemTotalWeight
	}

	averageWeight := 0
	if len(items) > 0 {
		averageWeight = totalWeight / len(items)
	}

	sort.Slice(items, func(i, j int) bool {
		weightI := items[i].Weight
		weightJ := items[j].Weight
		return weightI > weightJ
	})

	topItemsCount := 5
	if len(items) < topItemsCount {
		topItemsCount = len(items)
	}

	topHeaviestItems := items[:topItemsCount]

	categoryWeightPercentage := make(map[string]float64)
	for category, weight := range categoryWeights {
		categoryWeightPercentage[category] = float64(weight) / float64(totalWeight) * 100
	}

	return AnalysisResult{
		TotalWeight:      totalWeight,
		TopHeaviestItems: topHeaviestItems,
		BagWeights:       bagWeights,
		AverageWeight:	  averageWeight,
		PriorityWeights:  priorityWeights,
		CategoryWeights:   categoryWeights,
		CategoryWeightPercentage: categoryWeightPercentage,
	}
}

func generatePieItems(data []CategoryWeight) []opts.PieData {
	var items []opts.PieData
	for _, item := range data {
		items = append(items, opts.PieData{Name: item.Category, Value: item.Weight})
	}
	return items
}

func isValidTravelItem(item TravelItem) bool {
    if item.Name == "" {
        return false
    }
    if item.Amount < 0 {
        return false
    }
    if item.Weight < 0 {
        return false
    }
    return true
}

func renderToHtml(c interface{}) template.HTML {
	var buf bytes.Buffer
	r := c.(chartrender.Renderer)
	err := r.Render(&buf)
	if err != nil {
		log.Printf("Failed to render chart: %s", err)
		return ""
	}

	return template.HTML(buf.String())
}

func categoryWeightPieChart(data []CategoryWeight) (template.HTML, error) {
	pie := charts.NewPie()
	pie.SetGlobalOptions(
		charts.WithTitleOpts(
			opts.Title{
				Title:    "Weight distribution per Category",
				Subtitle: "Analyzed from travel items",
			},
		),
	)
	pie.SetSeriesOptions()
	pie.AddSeries("Category Weights",
		generatePieItems(data)).
		SetSeriesOptions(
			charts.WithPieChartOpts(
				opts.PieChart{
					Radius: 200,
				},
			),
			charts.WithLabelOpts(
				opts.Label{
					Show:      true,
					Formatter: "{b}: {c}",
				},
			),
		)
	buffer := new(bytes.Buffer)
	err := pie.Render(buffer)
	if err != nil {
		return "", err
	}
	return renderToHtml(pie), nil
}
