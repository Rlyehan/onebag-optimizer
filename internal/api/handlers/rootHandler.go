package handlers

import (
	"html/template"
	"net/http"

	"github.com/Rlyehan/onebag-optimizer/internal/utils"
	"go.uber.org/zap"
)

type RootHandler struct {
	logger *zap.Logger
}

func NewRootHandler(logger *zap.Logger) *RootHandler {
	return &RootHandler{
		logger: logger,
	}
}

func (h *RootHandler) ServeRoot(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Failed to load template", "ServeRoot")
		return
	}

	if err = tmpl.Execute(w, nil); err != nil {
		utils.HandleError(w, h.logger, http.StatusInternalServerError, err, "Error executing template", "ServeRoot")
		return
	}
}
