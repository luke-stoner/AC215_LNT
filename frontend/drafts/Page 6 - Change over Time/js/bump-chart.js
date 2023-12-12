// Set margins, width, height
let margin = { top: 40, right: 40, bottom: 70, left: 60 };
let width = 900 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// Initialize SVG drawing space
let svg = d3
    .select("#bump-chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// format date
let formatDate = d3.timeFormat("%Y%m%d")

// parse date
let parseDate = d3.timeParse("%Y%m%d")

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

    // Store csv data in global variable
    data = csv;

    // Define x and y scales and axes outside the updateVisualization function
    const xScale = d3.scaleTime().range([30, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = svg.append('g').attr('transform', `translate(0,${height+30})`);
    const yAxis = svg.append('g');

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

        // Filter data to only include specified candidates consistently in the top ten of mentions
        let selected_candidates = ['Biden', 'Trump', 'DeSantis', 'Haley', 'Ramaswamy', 'Scott', 'Pence', 'Christie']

        // Set a color scale by candidate name
        const colorScale = d3.scaleOrdinal()
            .domain(selected_candidates) // Use selected_candidates list to maintain consistency
            .range(d3.schemeCategory10); // Using a categorical color scheme

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
            .range([height, 0]);

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
        svg
            .selectAll(".line")
            .data(nestedRankedData)
            .join('path')
            .attr("class", "line")
            .attr("d", (d) => line(d.values)) // Adjust to use 'values' directly
            .style("stroke", (d) => colorScale(d.candidate)); // Use color scale for lines

        console.log(nestedRankedData);

        // Transition for x-axis and y-axis
        xAxis.transition().duration(500).call(d3.axisBottom(xScale).ticks(d3.timeWeek.every(num_weeks)));
        yAxis.transition().duration(500).call(d3.axisLeft(yRankScale).ticks(8));

        // Remove existing axis titles
        svg.selectAll(".axis-title").remove();

        // Append y-axis title
        svg.append("text")
            .attr("class", "axis-title")
            .attr("transform", "rotate(-90)")
            .attr("y",  -40) // Adjust position as needed
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ranking");

        // Append x-axis title
        svg.append("text")
            .attr("class", "axis-title")
            .attr("x", width / 2)
            .attr("y", height + 50) // Adjust position as needed
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Date");

        // Update circles for data points
        const points = svg.selectAll(".point-group").data(nestedRankedData);

        points.exit().remove();

        const newPoints = points.enter().append("g").attr("class", "point-group");

        const allPoints = newPoints.merge(points);

        // Define the size for candidate images
        const imageSize = 40; // Adjust the size as needed

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
            .style("fill", (d) => d3.color(colorScale(d.candidate)).copy({opacity: 0.4}))

        // Update circles for data points to use candidate images
        const images = allPoints
            .selectAll("image")
            .data((d) => d.values); // Ensure data is correctly bound using 'values'

        const tooltip = d3
            .select("#bump-chart-area")
            .append("div")
            .attr("class", "tooltip");

        let tooltip_values = []
        if (column==='volume') {
            tooltip_values = ['Number of Mentions: ', 'd.label']
        }
        else {
            tooltip_values = ['Positive Mentions: ', 'formatAsPercentage(d.label)']
        }

        images.exit().remove();

        images
            .enter()
            .append("image")
            .merge(images)
            .attr("class", "datapoint-image")
            .attr("x", (d) => xScale(d.date) - imageSize / 2) // Adjust positioning as needed
            .attr("y", (d) => yRankScale(d.rank) - imageSize / 2) // Adjust positioning as needed
            .attr("width", imageSize)
            .attr("height", imageSize)
            .attr("xlink:href", (d) => {
                // Access the 'photo' attribute directly from the candidate object in nestedRankedData
                const candidate = nestedRankedData.find(candidate => candidate.candidate === d.candidate);
                return candidate ? candidate.photo : ''; // Return the photo path or empty string if not found
            })
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                if (column==='volume') {
                    tooltip.html(`${d.candidate}<br/>Number of Mentions: ${d.label}`)
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 25) + "px");
                }
                else {
                    tooltip.html(`${d.candidate}<br/>Positive Mentions: ${formatAsPercentage(d.label)}`)
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 25) + "px");
                }
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

        const rings = allPoints
            .selectAll(".rings")
            .data((d) => d.values); // Ensure data is correctly bound using 'values'

        rings.exit().remove();

        rings
            .enter()
            .append("circle")
            .merge(circles)
            .attr("class", "circles") // Updated class name to 'circles'
            .attr("cx", (d) => xScale(d.date)) // Positioning aligned with image
            .attr("cy", (d) => yRankScale(d.rank)) // Positioning aligned with image
            .attr("r", imageSize / 1.5) // Adjust the radius to accommodate the image size and padding
            .style("fill", "none")
            .style("stroke", (d) => colorScale(d.candidate)) // Use color scale for stroke
            .style("stroke-width", 5)

        // Select and update lines for data points
        const lines = svg.selectAll(".line").data(nestedRankedData);

        lines.exit().remove();

        lines
            .enter()
            .append("path")
            .attr("class", "line")
            .merge(lines)
            .transition()
            .duration(500)
            .attr("d", (d) => line(d.values)) // Adjust to use 'values' directly
            .style("stroke", (d) => colorScale(d.candidate)) // Use color scale for lines
            .style("opacity", 1); // Adjust opacity as needed

    }
})
