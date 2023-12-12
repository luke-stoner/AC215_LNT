// Two dates that I have selected for the "event selection" dropdwon boxes:
// let event_1 = 20230801;
// let event_2 = 20230609;

// set margins, width, height
let impactMargin = {top: 40, right: 40, bottom: 60, left: 60};
let impactWidth = 900 - impactMargin.left - impactMargin.right;
let impactHeight = 600 - impactMargin.top - impactMargin.bottom;

// initialize svg drawing space
let impactSvg = d3.select("#impact-event-chart-area").append("svg")
    .attr("width", impactWidth + impactMargin.left + impactMargin.right)
    .attr("height", impactHeight + impactMargin.top + impactMargin.bottom)
    .append("g")
    .attr("transform", "translate(" + impactMargin.left + "," + impactMargin.top + ")");

// format date
//let formatDate = d3.timeFormat("%Y%m%d")

// parse date
let parseDate2 = d3.timeParse("%Y%m%d")

// Initialize data
let data2 = []; // Initialize empty array

// Load CSV file and process data
d3.csv("data/labeled.csv", row => {
    row.date = parseDate2(row.date);
    return row;
}).then(csv => {
    data2 = csv;

    // define scales for data
    let x = d3.scaleTime()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);

    // Define x and y scales and axes outside the updateVisualization function
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = impactSvg.append('g').attr('transform', `translate(0,${height})`);
    const yAxis = impactSvg.append('g');

    // Define a color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // set date data to full range by default
    let filtered_date_data = data2

    // call update visualization function
    updateVisualization()

    // Update the visualization based on a change in selection in the dropdown menu
    document.getElementById('line-stat-selection-impact').addEventListener('change', function () {
        // Call the updateVisualization function when the dropdown value changes
        updateVisualization();
    });

    // Listen for changes in checkboxes and update graph accordingly
    document.querySelectorAll('#impact-event-checkboxes input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateVisualization);
    });

    // Update visualization function
    function updateVisualization() {

        const selectedCandidates = []; // Array to store selected candidates
        // Get all checkbox elements in the impact event section
        const checkboxes = document.querySelectorAll('#impact-event-checkboxes input[type="checkbox"]');
        // Iterate through checkboxes to find selected candidates
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                // Slice the checkbox ID to remove '-impact' and add to array
                const candidateName = checkbox.id.slice(0, -7); // Assuming "-impact" is 7 characters long
                selectedCandidates.push(candidateName);
            }
        });
        // Additional code to set the date range based on the selected event
        let selectedEvent = document.getElementById("event-selection").value;
        let eventDate = parseDate2(selectedEvent);
        let startDate = d3.timeDay.offset(eventDate, -14); // 2 weeks before the event
        let endDate = d3.timeDay.offset(eventDate, 14); // 2 weeks after the event

        filtered_date_data = data2.filter(d => d.date >= startDate && d.date <= endDate);

        // Remove existing lines before redrawing
        impactSvg.selectAll('.line').remove();


        // filter data to only include selected candidates
        let filteredData = filtered_date_data.filter(candidate => {
            return selectedCandidates.includes(candidate.last_name);
        });
        // Get the selected attribute from the dropdown
        let column = document.getElementById("line-stat-selection-impact").value;
        // Group data by candidate
        const groupedData = d3.group(filteredData, d => d.last_name)
        console.log("groupedData", groupedData)
        // Get desired dependent variable and aggregated data
        let aggregatedData;

        if(column==='volume') {
            // Aggregate by week for each candidate
            aggregatedData = Array.from(groupedData, ([key, values]) => {
                const weeklyData = d3.timeWeek.every(2).range(
                    d3.min(values, d => d.date),
                    d3.max(values, d => d.date)
                ).map(week => {
                    const filtered = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
                    const average = d3.count(filtered, d => d.label);
                    return { date: week, label: average };
                });
                return { candidate: key, values: weeklyData };
            });
        }
        else {
            // Aggregate by week for each candidate
            aggregatedData = Array.from(groupedData, ([key, values]) => {
                const weeklyData = d3.timeWeek.every(2).range(
                    d3.min(values, d => d.date),
                    d3.max(values, d => d.date)
                ).map(week => {
                    const filtered = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
                    const average = d3.mean(filtered, d => d.label);
                    return { date: week, label: average };
                });
                return { candidate: key, values: weeklyData };
            });
        }
        // Define line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.label));

        console.log(aggregatedData)

        // Update the color scale to use candidate names
        colorScale.domain(selectedCandidates);

        // Draw lines
        impactSvg.selectAll('.line')
            .data(aggregatedData)
            .enter().append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .style('stroke', d => colorScale(d.candidate)) // Use candidate name for color
            .style('fill', 'none');


        // Update scales domain based on aggregatedData
        xScale.domain([d3.min(aggregatedData, d => d3.min(d.values, v => v.date)), d3.max(aggregatedData, d => d3.max(d.values, v => v.date))]);
        yScale.domain([0, d3.max(aggregatedData, d => d3.max(d.values, v => v.label))]);

        // Transition for x-axis and y-axis
        xAxis.transition().duration(500).call(d3.axisBottom(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft(yScale));

        // Select and update circles for data points
        const points = impactSvg.selectAll('.point-group')
            .data(aggregatedData);

        // Remove exiting point groups
        points.exit().remove();

        // Enter new point groups and append circles
        const newPoints = points.enter().append('g').attr('class', 'point-group');

        // Merge existing and new points
        const allPoints = newPoints.merge(points);

        // Update circles for data points
        const circles = allPoints.selectAll('circle')
            .data(d => d.values);

        circles.exit().remove(); // Remove circles that no longer have data

        circles.enter().append('circle')
            .merge(circles)
            .attr('class', 'datapoint')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.label))
            .attr('r', 3)
            .style('fill', 'white') // Filling circles with white color
            .style('stroke', 'grey') // Adding black stroke
            .style('stroke-width', 1); // Adjusting stroke width as needed

        // Select existing lines and apply data to update/exit selection
        const lines = impactSvg.selectAll('.line').data(aggregatedData);

        // Remove exiting lines
        lines.exit().remove();

        // Update existing lines with transition
        lines.transition().duration(500)
            .attr('d', d => line(d.values))
            .style('stroke', (d) => colorScale(d.candidate)) // Use color scale for line stroke
            .style('fill', 'none'); // Again, ensure that fill is set to none


        // Append new lines with transition
        lines.enter().append('path')
            .attr('class', 'line')
            .attr('d', d => line(d.values))
            .style('stroke', (d) => colorScale(d.candidate)) // Use color scale for line stroke
            .style('opacity', 0)
            .transition().duration(500)
            .style('opacity', 1);

    }

    // Event listener for the dropdown
    document.getElementById('event-selection').addEventListener('change', updateVisualization);

    // Initial call to update the visualization
    updateVisualization();
});
