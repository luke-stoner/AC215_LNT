//DYNAMIC SIZING///
bump_leftcol_pxls = parseFloat(d3.select('#bumpchartcolumn').style('width'));

// Calculate the required total width
let requiredSpaceForText = 110; // Width of the longest text element
let totalWidth = bump_leftcol_pxls + requiredSpaceForText;

// Adjust left margin to center the plot within the total width
let margin_bump = {
    top: 40,
    right: (totalWidth - bump_leftcol_pxls) / 2 + 40,
    bottom: 70,
    left: (totalWidth - bump_leftcol_pxls) / 2 // Adjusted left margin
};

// Recalculate width_bump based on new margins
let width_bump = bump_leftcol_pxls - margin_bump.left - margin_bump.right - 30;
let height_bump = 500 - margin_bump.top - margin_bump.bottom;

// Initialize SVG drawing space with updated width
let svg_bump = d3
    .select("#bump-chart-area")
    .append("svg")
    .attr("width", totalWidth) // Set to totalWidth
    .attr("height", height_bump + margin_bump.top + margin_bump.bottom)
    .append("g")
    .attr("transform", "translate(" + margin_bump.left + "," + margin_bump.top + ")");

// format percentage
function formatAsPercentage(num) {
    return new Intl.NumberFormat('default', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(num);
}

// Initialize data
let data = []; // Initialize empty array

// Load CSV file
d3.csv("data/labeled.csv", row => {
    row.date = parseDate(row.date);
    return row
}).then(csv => {

    // format percentage
    function formatAsPercentage(num) {
        return new Intl.NumberFormat('default', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(num);
    }

    // Store csv data in global variable
    let data = csv;

    // Define x and y scales and axes outside the updateVisualization function
    const xScale = d3.scaleTime().range([30, width_bump]);
    const yScale = d3.scaleLinear().range([height_bump, 0]);

    const xAxis = svg_bump.append('g').attr('transform', `translate(0,${height_bump+30})`);
    const yAxis = svg_bump.append('g');

    // Filter data to only include specified candidates consistently in the top ten of mentions
    let selected_candidates = ['Biden', 'Trump', 'DeSantis', 'Haley', 'Ramaswamy', 'Scott', 'Pence', 'Christie']

    // Set a color scale by candidate name
    const colorScale = candidateColorMap;

    // call update visualization function
    updateVisualization()

    // Update the visualization based on a change in selection in the dropdown menu
    document.getElementById('bump-chart-selection').addEventListener('change', function () {
        // Call the updateVisualization function when the dropdown value changes
        updateVisualization();
    });


    function updateVisualization() {

        // Get the selected attribute from the dropdown
        let column = document.getElementById("bump-chart-selection").value;

        let filtered_data = data.filter((d) => selected_candidates.includes(d.last_name));

        // Function to generate photo paths
        function generatePhotoPath(lastName) {
            return `img/candidate_portraits/${lastName.toLowerCase()}.png`;
        }

        // Create a map to store photo paths for each candidate
        let photoMap = new Map();

        // Add 'photo' variable to each candidate object and store in the map
        filtered_data.forEach(candidate => {
            candidate.photo = generatePhotoPath(candidate.last_name);
            photoMap.set(candidate.last_name, candidate.photo);
        });

        // Group data by candidate
        const groupedData = d3.group(filtered_data, (d) => d.last_name);

        // Get desired dependent variable and aggregated data
        let aggregatedData;

        // Set number of weeks for each time period
        const num_weeks = 3

        if (column === "volume") {
            // Aggregate by week for each candidate
            aggregatedData = Array.from(groupedData, ([key, values]) => {
                const weeklyData = d3
                    .timeWeek.every(num_weeks)
                    .range(
                        d3.min(values, (d) => d.date),
                        d3.max(values, (d) => d.date)
                    )
                    .map((week) => {
                        const filtered = values.filter(
                            (d) => d.date >= week && d.date < d3.timeWeek.offset(week, num_weeks)
                        );
                        const average = d3.count(filtered, (d) => d.label);
                        return {date: week, label: average, candidate: key};
                    });
                return weeklyData;
            });
        } else {
            // Aggregate by week for each candidate
            aggregatedData = Array.from(groupedData, ([key, values]) => {
                const weeklyData = d3
                    .timeWeek.every(num_weeks)
                    .range(
                        d3.min(values, (d) => d.date),
                        d3.max(values, (d) => d.date)
                    )
                    .map((week) => {
                        const filtered = values.filter(
                            (d) => d.date >= week && d.date < d3.timeWeek.offset(week, num_weeks)
                        );
                        const average = d3.mean(filtered, (d) => d.label);
                        return {date: week, label: average, candidate: key};
                    });
                return weeklyData;
            });
        }

        // Flatten aggregatedData array to work with it easily
        const flatData = aggregatedData.flat();

        // Group by date to calculate rankings for each week
        const groupedByDate = d3.group(flatData, (d) => d.date);

        // Calculate rankings for each week based on label values
        const rankedData = Array.from(groupedByDate, ([date, values]) => {
            const sortedValues = values.sort((a, b) => b.label - a.label);
            sortedValues.forEach((d, i) => (d.rank = i + 1));
            return sortedValues;
        }).flat();

        // Nest the ranked data back into an array by candidate for visualization
        const nestedRankedData = Array.from(d3.group(rankedData, (d) => d.candidate), ([key, values]) => {
            return {
                candidate: key,
                values: values,
                photo: photoMap.get(key) // Retrieve photo path from the map based on the candidate's last name
            };
        });

        console.log(nestedRankedData)

        // Define y scale for ranking
        const maxRank = d3.max(rankedData, (d) => d.rank);
        const yRankScale = d3.scaleLinear()
            .domain([maxRank, 1])
            .range([height_bump, 0]);

        // Update scales domain based on aggregatedData
        xScale.domain([
            d3.min(rankedData, (d) => d.date),
            d3.max(rankedData, (d) => d.date),
        ]);

        // Define line generator based on ranked data
        const line = d3
            .line()
            .x((d) => xScale(d.date))
            .y((d) => yRankScale(d.rank));

        // Draw lines based on the ranked data
        svg_bump
            .selectAll(".line")
            .data(nestedRankedData)
            .join('path')
            .attr("class", "line")
            .attr("d", (d) => line(d.values)) // Adjust to use 'values' directly
            .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()]); // Use color scale for lines

        console.log(nestedRankedData);
        let formatDateToMonthDay = d3.timeFormat("%m/%d");

        // Transition for x-axis and y-axis
        xAxis.transition().duration(500).call(d3.axisBottom(xScale).ticks(d3.timeWeek.every(num_weeks)));
        yAxis.transition().duration(500)
            .call(d3.axisLeft(yRankScale)
                .ticks(8)
                .tickSize(8) // Adjust tick size as needed
                .tickPadding(2) // Increase padding between ticks and text
            )
            .selectAll('path') // Select the axis line
            .style('stroke-opacity', '0') // Make the y-axis line transparent

        yAxis.selectAll('text') // Select all text elements
            .style('font-size', '14px'); // Increase tick font size to 14

        // Remove existing axis titles
        svg_bump.selectAll(".axis-title").remove();

        // Append y-axis title
        svg_bump.append("text")
            .attr("class", "axis-title")
            .attr("transform", "rotate(-90)")
            .attr("y",  -45) // Adjust position as needed
            .attr("x", -height_bump / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ranking");

        // Append x-axis title
        svg_bump.append("text")
            .attr("class", "axis-title")
            .attr("x", width_bump / 2 + 20)
            .attr("y", height_bump + 50) // Adjust position as needed
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");

        // Update circles for data points
        const points = svg_bump.selectAll(".point-group").data(nestedRankedData);

        points.exit().remove();

        const newPoints = points.enter().append("g").attr("class", "point-group");

        const allPoints = newPoints.merge(points);

        // Define the size for candidate images
        const imageSize = 35; // Adjust the size as needed

        const circles = allPoints
            .selectAll(".circles")
            .data((d) => d.values); // Ensure data is correctly bound using 'values'

        circles.exit().remove();

        circles
            .enter()
            .append("circle")
            .merge(circles)
            .attr("class", "circles") // Updated class name to 'circles'
            .attr("cx", (d) => xScale(d.date)) // Positioning aligned with image
            .attr("cy", (d) => yRankScale(d.rank)) // Positioning aligned with image
            .attr("r", imageSize / 1.5) // Adjust the radius to accommodate the image size and padding
            .style("fill", (d) => {
                const originalColor = candidateColorMap[d.candidate.toLowerCase()];
                const lighterColor = d3.interpolate(originalColor, "#f0f0f0")(0.6); // Adjust the second color value for the desired lightness
                return lighterColor;
              })
            .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()]) // Use color scale for stroke
            .style("stroke-width", 5) // Use color scale for stroke

        // Update circles for data points to use candidate images
        const images = allPoints
            .selectAll("image")
            .data((d) => d.values); // Ensure data is correctly bound using 'values'

        const tooltip = d3
            .select("#bump-chart-area")
            .append("div")
            .attr("class", "tooltip");

        svg_bump.selectAll(".clip-path").remove();

        // Create a clipping path for each circle
        const clipPaths = allPoints
            .selectAll(".clip-path")
            .data((d) => d.values);

        clipPaths.exit().remove();

        clipPaths.enter()
            .append("clipPath")
            .attr("class", "clip-path")
            .attr("id", (d, i) => `clip-${d.candidate}-${i}`)
            .append("circle")
            .attr("cx", (d) => xScale(d.date))
            .attr("cy", (d) => yRankScale(d.rank))
            .attr("r", imageSize / 2);  // Use the same radius as your circles

        images.exit().remove();

        images
            .enter()
            .append("image")
            .merge(images)
            .attr("class", "datapoint-image")
            .attr("x", (d) => xScale(d.date) - imageSize / 2) // Adjust positioning as needed
            .attr("y", (d) => yRankScale(d.rank) - imageSize / 2)//.attr("y", (d) => yRankScale(d.rank) - imageSize / 2) // Adjust positioning as needed
            .attr("width", imageSize)
            .attr("height", imageSize)
            .attr("xlink:href", (d) => {
                // Access the 'photo' attribute directly from the candidate object in nestedRankedData
                const candidate = nestedRankedData.find(candidate => candidate.candidate === d.candidate);
                return candidate ? candidate.photo : ''; // Return the photo path or empty string if not found
            })
            .attr("clip-path", (d, i) => `url(#clip-${d.candidate}-${i})`)
            .on("mouseover", function(event, d) {
                // Decrease opacity of other lines
                svg_bump.selectAll(".line")
                    .style("opacity", function(lineData) {
                        return lineData.candidate === d.candidate ? 1 : 0.2;
                    });

                // Decrease opacity of other circles' strokes
                svg_bump.selectAll(".circles")
                    .style("stroke-opacity", function(circleData) {
                        return circleData.candidate === d.candidate ? 1 : 0.2;
                    });

                // Decrease opacity of other images
                svg_bump.selectAll(".datapoint-image")
                    .style("opacity", function(imageData) {
                        return imageData.candidate === d.candidate ? 1 : 0.2;
                    });

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                    if (column === "volume") {
                        tooltip
                          .html(
                            `<div style="text-align: center; font-weight: bold;">
                                                  ${d.candidate}
                                               </div>
                                              Number of Mentions: ${d.label.toLocaleString()}`
                          )
                          .style("left", event.pageX + 12 + "px")
                          .style("top", event.pageY - 25 + "px");
                      } else {
                        tooltip
                          .html(
                            `<div style="text-align: center; font-weight: bold;">
                                  ${d.candidate}
                               </div>
                               Positive Mentions: ${formatAsPercentage(d.label)}`
                          )
                          .style("left", event.pageX + 12 + "px")
                          .style("top", event.pageY - 25 + "px");
                      }
            })
            .on("mouseout", function(d) {
                // Restore opacity of all lines on mouseout
                svg_bump.selectAll(".line")
                    .style("opacity", 1);

                // Restore opacity of all circles' strokes on mouseout
                svg_bump.selectAll(".circles")
                    .style("stroke-opacity", 1);

                // Restore opacity of all circles' strokes on mouseout
                svg_bump.selectAll(".datapoint-image")
                    .style("opacity", 1);

                // Rest of your tooltip code for mouseout
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Select and update lines for data points
        const lines = svg_bump.selectAll(".line").data(nestedRankedData);

        lines.exit().remove();

        lines
            .enter()
            .append("path")
            .attr("class", "line")
            .merge(lines)
            .transition()
            .duration(500)
            .attr("d", (d) => line(d.values)) // Adjust to use 'values' directly
            .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()]) // Use color scale for lines
            .style("stroke-width", 5)
            .style("opacity", 1); // Adjust opacity as needed

        svg_bump.selectAll(".cand_labels").remove();
        // Append text labels at the end of each line
        nestedRankedData.forEach(candidateData => {
            const lastDataPoint = candidateData.values[candidateData.values.length - 1];
            svg_bump.append("text")
                .attr("x", xScale(lastDataPoint.date) + 40) // Adjust this value as needed
                .attr("y", yRankScale(lastDataPoint.rank))
                .attr("class", "cand_labels")
                .text(candidateData.candidate)
                .style("fill", candidateColorMap[candidateData.candidate.toLowerCase()])
                .style("font-weight", "bold")
                .style("font-size", "18px")
                .style("text-anchor", "start")
                .style("alignment-baseline", "middle");
        });
    }
})
