package charts

import (
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	chartrender "github.com/go-echarts/go-echarts/v2/render"
	"github.com/Rlyehan/onebag-optimizer/models"
	"html/template"
	"bytes"
	"log"
)


func generatePieItems(data []models.CategoryWeight) []opts.PieData {
	var items []opts.PieData
	for _, item := range data {
		items = append(items, opts.PieData{Name: item.Category, Value: item.Weight})
	}
	return items
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

func CategoryWeightPieChart(data []models.CategoryWeight) (template.HTML, error) {
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
