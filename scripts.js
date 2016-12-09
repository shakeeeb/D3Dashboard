$(document).ready(function(){

  // 2 bivariate scatterplots
  // a bar graph with bins
  // a
    // ok now that i have those, i've gotta make the actual graph

    var svg1 = d3.select("#svg1")
    var svg2 = d3.select("#svg2")
    var svg3 = d3.select("#svg3")
    var svg4 = d3.select("#svg4")
    d3.csv('clean.csv', function(d){
      return d
    }, function(error, data){
      if (error) throw error
      // so, i can't do exactly this
      buildGraph(data, "# Poverty", "# Hispanic", svg1)
      buildGraph(data, "# Poverty", "# Black", svg2)
      // i will do 2 bivariate scatterplots, a histogram, and a parallel coordinates
      buildHist(data,"# Poverty", svg3)
      buildChart(data, svg4)
    })

})


function buildGraph(data, Xvariable, Yvariable, svg){
// SCATTERPLOTS
var margin = {top: 50, right: 100, bottom: 10, left: 100},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;


    // ready up the axes and scales
    var y = d3.scale.linear().range([height, 0]) // y scale
    var x = d3.scale.linear().range([0, width]) // x scale
    var yAxis = d3.svg.axis().scale(y).orient("left")
    var xAxis = d3.svg.axis().scale(x).orient("bottom")

    // set the domains of the scales
    x.domain(d3.extent(data, function(d){ return parseInt(d[Xvariable]) }))
    y.domain([0, d3.max(data, function(d){ return parseInt(d[Yvariable])})])

    svg.attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .append("g")

    // create the dots
    var dots = svg.append("g")
    .selectAll("dot")
    .data(data).enter()
    .append("circle")
    .attr('class', 'dot')
    .attr("r", 5)
    .style("opacity", .5)
    .attr("cx", function(d){return x(parseInt(d[Xvariable]))})
    .attr("cy", function(d){return y(parseInt(d[Yvariable]))})

    svg.append("g")
    .attr("class","axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis)

    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 -margin.left)
    .attr("x", 0 - (height/2))
    .attr("dy", "1em")
    .style("text-anchor", "middle").text(Xvariable)

    svg.append("text")
      .attr("transform",
            "translate(" + ((width + margin.right + margin.left)/2) + " ," +
                           (height + margin.top + margin.bottom - 20) + ")")
      .style("text-anchor", "middle")
      .text(Yvariable)
}

function buildChart(data, svg){
  // PARALLEL COORDINATES
  var margin = {top: 20, right: 100, bottom: 40, left: 100},
  width = 1000 - margin.left - margin.right,
  height = 1000 - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangePoints([0, width], 1)
  var y = {}
  var dragging = {}

  var line = d3.svg.line()
  var axis = d3.svg.axis().orient("left")
  var background
  var foreground
  svg.attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      fdata = data.map(function(d){
        return {"Total Enrollment": d["Total Enrollment"],
        "# Female": d["# Female"],
        "# Male" : d["# Male"],
        "# Poverty": d["# Poverty"],
        "# Hispanic" : d["# Hispanic"],
        "# Asian" : d["# Asian"],
        "# White" : d["# White"],
        "# Black" : d["# Black"]}
      })

      x.domain(dimensions = d3.keys(fdata[0]).filter(function(d) {
        return d != "School Name" && (y[d] = d3.scale.linear() // oh this sets the y scale for every attribute caught, makes sense
            .domain(d3.extent(data, function(p) { return +p[d] }))
            .range([height, 0]))
      }))

      // add bg lines
      background = svg.append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(fdata)
      .enter().append("path")
      .attr("d", path);

      // fg lines
      foreground = svg.append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(fdata)
      .enter().append("path")
      .attr("d", path);

      // dragging is extraneous
      var g = svg.selectAll(".dimension")
         .data(dimensions)
       .enter().append("g")
         .attr("class", "dimension")
         .attr("transform", function(d) { return "translate(" + x(d) + ")"; })

      // add axis and title
      g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });

        // Add and store a brush for each axis.
      g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
          })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

        function path(d) {
          return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
        }

        function position(d) {
          var v = dragging[d];
          return v == null ? x(d) : v;
        }

        function transition(g) {
          return g.transition().duration(500);
        }

        function brushstart() {
          d3.event.sourceEvent.stopPropagation();
        }

        function brush() {
          var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });
          foreground.style("display", function(d) {
            return actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
          });
        }

}

function buildHist(fdata, cVariable, svg){
  // HISTOGRAM
  // take an attribute and display it-- number of impoverished students is the attribute i choose
  // woo! its really fucked up but its displaying!
  var margin = {top: 20, right: 100, bottom: 40, left: 100},
      width = 1000 - margin.left - margin.right,
      height = 1000 - margin.top - margin.bottom;
  var x = d3.scale.linear().domain([0, 2000]).range([0, width])
  var formatCount = d3.format(",.0f")
  // Generate a histogram using twenty uniformly-spaced bins.
  var bins = d3.layout.histogram().bins(x.ticks(30))(fdata.map(function(d){return d["# Poverty"]}))
  var y = d3.scale.linear().domain([0, d3.max(bins, function(d) { return d.y; })]).range([height, 0])
  var xAxis = d3.svg.axis().scale(x).orient("bottom")

  svg.attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");

  var bar = svg.selectAll(".bar")
    .data(bins)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    bar.append("rect")
      .attr("x", 1)
      .attr("width", x(bins[0].dx) - 1)
      .attr("height", function(d) { return height - y(d.y); });

    bar.append("text")
      .attr("dy", ".75em")
      .attr("y", 6)
      .attr("x", x(bins[0].dx) / 2)
      .attr("text-anchor", "middle").style("fill", "white")
      .text(function(d) { return formatCount(d.y) })

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
}
