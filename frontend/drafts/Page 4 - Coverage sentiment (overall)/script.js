// Load data from your JSON file
d3.json("data/data.json").then(data => {

    // Sort data based on avg_sentiment
    data.sort((a, b) => d3.descending(+a.avg_sentiment, +b.avg_sentiment));

    // Set dimensions and margins for the chart
    const margin = { top: 30, right: 30, bottom: 40, left: 260 }, // Increased left margin
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Append SVG object to the chart div
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create X axis
    const x = d3.scaleLinear()
        .domain([0, 1])  // Define the range of average sentiment
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    // Create Y axis
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.name))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll(".tick text")
        .attr("x", -y.bandwidth() * 1.2) // Move the label further to the left
        .style("text-anchor", "end")
        .style("font-size", "16px");

    // Add bars
    svg.selectAll("myRect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.avg_sentiment))
        .attr("height", y.bandwidth())
        .attr("fill", d => d.party === "R" ? "#c93235" : "#1475b7");

    // Add bar extensions to reach the circles
    svg.selectAll("barExtensions")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", x(0) - y.bandwidth()/2) // Start at the middle of the circle
        .attr("y", d => y(d.name))
        .attr("width", y.bandwidth()) // Width to cover the distance to the middle of the circle
        .attr("height", y.bandwidth())
        .attr("fill", d => d.party === "R" ? "#c93235" : "#1475b7");
    // Add background circles
    svg.selectAll("backgroundCircles")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", x(0) - y.bandwidth() / 2)
        .attr("cy", d => y(d.name) + y.bandwidth() / 2)
        .attr("r", y.bandwidth() / 2)
        .attr("fill", "white")
        .attr("stroke", d => d.party === "R" ? "#c93235" : "#1475b7")
        .attr("stroke-width", 3);
    // Add images
    svg.selectAll("candidateImages")
        .data(data)
        .enter()
        .append("image")
        .attr("xlink:href", d => d.photo)
        .attr("x", x(0) - y.bandwidth()) // Position the image to the left of 0 on the y-axis
        .attr("y", d => y(d.name))
        .attr("height", y.bandwidth())
        .attr("width", y.bandwidth())
        .attr("clip-path", "circle()"); // Clip image to a circle
});
