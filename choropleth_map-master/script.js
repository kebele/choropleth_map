//thanks to gabriele corti, @phapp88, NormanEWright

/*
- ölçüler, margin, svg, legend
- başlıklar
- tooltip
- positions (svg, legend)
- fetch data
- edu and topos json larını birleştirme
- 
*/

//DIMENSIONS
//margin
const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20
};

// svg
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

//legend
const legendValues = {
  percentage: [5, 10, 20, 30, 40, 50],
  color: [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#ffff33",
    "#a65628"
  ],
  height: 15,
  width: 30
};

//BAŞLIKLAR
const svg = d3.select("body");
svg.append("h1").attr("id", "title").text("US Educational Attainment");

svg
  .append("h3")
  .attr("id", "description")
  .text("Bachelor's degree or higher 2010-2014");

const tooltip = svg.append("div").attr("id", "tooltip");

tooltip.append("p").attr("class", "area");

tooltip.append("p").attr("class", "education");

//POSITIONS
//svg position
const svgContainer = svg
  .append("svg")
  //viewBox = "min-x min-y width height"
  .attr(
    "viewBox",
    `0 0 ${width + margin.left + margin.right} ${
      height + margin.top + margin.bottom
    }`
  );

// group elements
const svgCanvas = svgContainer
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// legend elements
const legend = svgCanvas
  .append("g")
  .attr("id", "legend")
  // legend position
  .attr(
    "transform",
    `translate(${
      width - legendValues.percentage.length * legendValues.width - 50
    }, 0)`
  );

// produce legend
legend
  .selectAll("rect")
  .data(legendValues.percentage)
  .enter()
  .append("rect")
  .attr("width", legendValues.width)
  .attr("height", legendValues.height)
  .attr("x", (d, i) => i * legendValues.width)
  .attr("y", 0)
  .attr("fill", (d, i) => legendValues.color[i]);

// legend text
legend
  .selectAll("text")
  .data(legendValues.percentage)
  .enter()
  .append("text")
  .attr("x", (d, i) => i * legendValues.width)
  // position the labels below the rectangle elements
  .attr("y", legendValues.height * 2)
  .style("font-size", "0.6rem")
  .text((d) => `${d}%`);

//legend colors ve range eşleştirme
//https://www.d3indepth.com/scales/#scales-with-continuous-input-and-discrete-output
const colorScale = d3.scaleQuantize().range(legendValues.color);

//JSON lar
//svg json
const URL_SVG =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

//education json
const URL_EDU =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";

// fetch edu json, mergeData func da kullanma
fetch(URL_EDU)
  .then((response) => response.json())
  .then((json) => mergeData(json));

// merge edu json and svg json
function mergeData(data) {
  fetch(URL_SVG)
    .then((response) => response.json())
    .then((json) => {
      //pull the each edu data
      for (let i = 0; i < data.length; i++) {
        // for fips ataması
        let fips = data[i].fips;

        // pulling geometries bilgilerini çekme, URL_SVG den
        let geometries = json.objects.counties.geometries;
        for (let j = 0; j < geometries.length; j++) {
          let id = geometries[j].id;
          if (fips === id) {
            //id ler ile fips aynı ise iki bilgiden oluşan nesne yapacak, buda json olarak çıkacak, bunu da drawMap(data) de kullanacakolarak
            geometries[j] = Object.assign({}, geometries[j], data[i]);
            break;
          }
        }
      }
      // update as json
      return json;
    })
    .then((json) => drawMap(json));
}

function drawMap(data) {
  colorScale.domain([
    0,
    d3.max(data.objects.counties.geometries, (d) => d.bachelorsOrHigher)
  ]);
  // console.log(data);
  //https://github.com/maptimelex/d3-mapping#4-a-d3-map-using-topojson
  let feature = topojson.feature(data, data.objects.counties);
  // console.log(feature);

  //https://www.dashingd3js.com/lessons/d3-geo-path
  const path = d3.geoPath();
  // console.log(path(feature));

  svgCanvas
    .selectAll("path")
    .data(feature.features)
    .enter()
    .append("path")
    .on("mouseenter", (d, i) => {
      tooltip
        .style("opacity", 1)
        .style("position", "absolute")
        .style("background-color", "gray")
        .attr("data-fips", data.objects.counties.geometries[i].fips)
        .attr(
          "data-education",
          data.objects.counties.geometries[i].bachelorsOrHigher
        )
        // https://stackoverflow.com/questions/16256454/d3-js-position-tooltips-using-element-position-not-mouse-position
        .style("left", `${d3.event.layerX + 5}px`)
        .style("top", `${d3.event.layerY + 5}px`);
      tooltip
        .select("p.area")
        .text(
          () =>
            `${data.objects.counties.geometries[i].area_name}, ${data.objects.counties.geometries[i].state}`
        );
      tooltip
        .select("p.education")
        .text(
          () => `${data.objects.counties.geometries[i].bachelorsOrHigher}%`
        );
    })

    .on("mouseout", () => tooltip.style("opacity", 0))
    .attr("d", path)
    .attr("transform", `scale(0.82, 0.62)`)
    .attr("class", "county")

    .attr("data-fips", (d, i) => data.objects.counties.geometries[i].fips)
    .attr("data-state", (d, i) => data.objects.counties.geometries[i].state)
    .attr("data-area", (d, i) => data.objects.counties.geometries[i].area_name)
    .attr(
      "data-education",
      (d, i) => data.objects.counties.geometries[i].bachelorsOrHigher
    )

    .attr("fill", (d, i) =>
      colorScale(data.objects.counties.geometries[i].bachelorsOrHigher)
    );
}
