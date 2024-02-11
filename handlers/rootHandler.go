package handlers

import (
	"html/template"
	"net/http"

	"github.com/Rlyehan/onebag-optimizer/utils"
)

func RootHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("./static/index.html")
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Failed to load template", "RootHandler")
		return
	}
	if err = tmpl.Execute(w, nil); err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err, "Error executing template", "RootHandler")
		return
	}
}
