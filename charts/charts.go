package charts

import (
	"github.com/go-echarts/go-echarts/v2/charts"
	"github.com/go-echarts/go-echarts/v2/opts"
	"github.com/PuerkitoBio/goquery"
	chartrender "github.com/go-echarts/go-echarts/v2/render"
	"github.com/Rlyehan/onebag-optimizer/models"
	"html/template"
	"bytes"
	"log"
	"strings"
	"html"
	"regexp"
	"fmt"
)


func generatePieItems(data []models.CategoryWeight) []opts.PieData {
	var items []opts.PieData
	for _, item := range data {
		items = append(items, opts.PieData{Name: item.Category, Value: item.Weight})
	}
	return items
}

func decodeHtmlEntities(input string) string {
	return html.UnescapeString(input)
}

func renderToHtml(c interface{}) template.HTML {
    var buf bytes.Buffer
    r := c.(chartrender.Renderer)
    err := r.Render(&buf)
    if err != nil {
        log.Printf("Failed to render chart: %s", err)
        return ""
    }

    htmlString := buf.String()
    doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlString))
    if err != nil {
        log.Printf("Failed to parse HTML: %s", err)
        return ""
    }

    // Extract the chart ID from the rendered script
    chartId := doc.Find("script").Text()
    re := regexp.MustCompile(`document.getElementById\('(.+?)'\)`)
    matches := re.FindStringSubmatch(chartId)
    if len(matches) < 2 {
        log.Printf("Failed to extract chart ID")
        return ""
    }
    extractedChartId := matches[1]

    script, _ := doc.Find("body script").Html()
	script = decodeHtmlEntities(script)

    cleanedHtml := fmt.Sprintf(`<div class="item" id="%s" style="width:900px;height:500px;"></div>
<script type="text/javascript">%s</script>`, extractedChartId, script)

    return template.HTML(cleanedHtml)
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
