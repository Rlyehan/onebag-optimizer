package main

import (
	"log"
	"net/http"
	"os"
	"time"
	"github.com/Rlyehan/onebag-optimizer/session"
	"github.com/Rlyehan/onebag-optimizer/middleware"
	"github.com/Rlyehan/onebag-optimizer/handlers"
)

var fileLogger *log.Logger

func setupLogger() {
    logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
    if err != nil {
        log.Fatalf("Failed to open log file: %v", err)
    }
    // defer logFile.Close()

    fileLogger = log.New(logFile, "", log.LstdFlags)
}

func main() {
    setupLogger()
    fileLogger.Println("This will be written to the log file.")

	sessionExpiry := 12 * time.Hour
	if value, exists := os.LookupEnv("SESSION_EXPIRY"); exists {
		duration, err := time.ParseDuration(value)
		if err == nil {
			sessionExpiry = duration
		}
	}

	sessionManager := session.NewSessionManager(sessionExpiry)

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	cleanupInterval := 1 * time.Hour
	if value, exists := os.LookupEnv("SESSION_CLEANUP_INTERVAL"); exists {
		duration, err := time.ParseDuration(value)
		if err == nil {
			cleanupInterval = duration
		}
	}

	go func() {
        for {
            time.Sleep(cleanupInterval)
            sessionManager.Cleanup()
        }
    }()


	http.HandleFunc("/", middleware.SessionMiddleware(handlers.RootHandler, sessionManager))
	http.HandleFunc("/process", middleware.SessionMiddleware(handlers.ProcessHandler, sessionManager))
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	if err := http.ListenAndServe(":"+port, nil); err != nil {
    	log.Fatalf("Failed to start server: %v", err)
	}
}