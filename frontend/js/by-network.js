// 1. Load the CSV file
d3.csv("data/labeled.csv").then(function (data) {
  // Extract unique network names and sort them
  var networks = Array.from(new Set(data.map((d) => d.network))).sort(
    d3.ascending,
  );

  // Calculate average scores for each network and party
  var avgScores = d3
    .rollups(
      data,
      (v) => d3.mean(v, (d) => d.positive_score),
      (d) => d.network,
      (d) => d.party,
    )
    .map(([network, partyData]) => {
      return partyData.map(([party, avgScore]) => {
        return { network, party, avgScore };
      });
    })
    .flat();

  // Filter out separate datasets for Democrats and Republicans
  var demData = avgScores.filter((d) => d.party === "D");
  var repData = avgScores.filter((d) => d.party === "R");

  // 3. Create SVG with extra width for spacing
  var svgWidth = 900;
  var svgHeight = 600;
  var svg = d3
    .select("#by-network")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  // Manually calculate y-positions
  var barHeight = svgHeight / networks.length;
  var yPos = (network) => networks.indexOf(network) * barHeight;

  // Adjust the bar width and spacing
  var barWidth = 50; // Adjust this value as needed
  var spacing = 10; // Adjust this value as needed

  var xScaleDem = d3
    .scaleLinear()
    .domain([0, d3.max(demData, (d) => d.avgScore)])
    .range([0, 400]);

  var xScaleRep = d3
    .scaleLinear()
    .domain([0, d3.max(repData, (d) => d.avgScore)])
    .range([0, 400]);

  // 4. Draw Bar Charts
  // Draw Democrats
  svg
    .selectAll(".bar.dem")
    .data(demData)
    .enter()
    .append("rect")
    .attr("class", "bar dem")
    .attr("x", (d) => 400 - xScaleDem(d.avgScore)) // Start from the right
    .attr("y", (d) => yPos(d.network))
    .attr("width", (d) => xScaleDem(d.avgScore)) // Width in the opposite direction
    .attr("height", barHeight - spacing) // Adjusted the bar height
    .style("fill", "blue");

  // Draw Republicans
  svg
    .selectAll(".bar.rep")
    .data(repData)
    .enter()
    .append("rect")
    .attr("class", "bar rep")
    .attr("x", 500)
    .attr("y", (d) => yPos(d.network))
    .attr("width", (d) => xScaleRep(d.avgScore))
    .attr("height", barHeight - spacing) // Adjusted the bar height
    .style("fill", "red");

  // Manually add network labels
  svg
    .selectAll(".network-label")
    .data(networks)
    .enter()
    .append("text")
    .attr("class", "network-label")
    .attr("x", 450) // Centered between the two sets of bars
    .attr("y", (d, i) => i * barHeight + barHeight / 2)
    .attr("dy", ".35em") // Vertically center
    .attr("text-anchor", "middle") // Center align
    .text((d) => d)
    .style("fill", "black");
});
