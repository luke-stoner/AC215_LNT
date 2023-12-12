
let selected_candidates_timeline = ["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"];

let candidateStatus_timeline = {
    "biden": true, "christie": true, "desantis": true, "haley": true,
    "kennedy": true, "pence": true, "ramaswamy": true, "scott": true,
    "trump": true, "williamson": true
};

// // Constant Color Scale
const colorScale_timeline = d3.scaleOrdinal(d3.schemeCategory10).domain(selected_candidates_timeline)
// console.log(colorScale("biden"))
let data_timeline = [];
// set margins, width, height
let margin_timeline = {top: 10, right: 10, bottom: 40, left: 40};

let width_timeline = 650 - margin_timeline.left - margin_timeline.right;

var width_timeline = parseInt(d3.select("#timelinerow").style("width"),10);
let height_timeline = 150 - margin_timeline.top - margin_timeline.bottom;

let parseDate_timeline = d3.timeParse("%Y%m%d")


// Initialize SVG for the new chart
let timelineSvg = d3.select("#timeline-window-area").append("svg")
    .attr("width", width_timeline + margin_timeline.left + margin_timeline.right)
    .attr("height", height_timeline + margin_timeline.top + margin_timeline.bottom)
    .append("g")
    //.attr("transform", "translate(" + margin_timeline.left + "," + margin_timeline.top + ")");

let timelineXScale = d3.scaleTime().range([0, width_timeline - 50]);
let timelineYScale = d3.scaleLinear().range([height_timeline, 0]);
let timelineXAxis = timelineSvg.append('g')
    //.attr('transform', `translate(0,${height_timeline})`) // Move x-axis to the bottom
    .call(d3.axisBottom(timelineXScale)
        .tickFormat(d3.timeFormat("%m/%d"))); // This line sets the format to month/day
let timelineYAxis = timelineSvg.append('g');
// Load CSV file and process data
d3.csv("data/labeled.csv", row => {
    // CSV processing logic
    row.date = parseDate_timeline(row.date);
    return row;
}).then(csv => {
    data_timeline = csv;
    // set date data to full range by default
    filtered_date_data_timeline = data_timeline;
    // Define x and y scales and axes outside the updateVisualization function
    // Initialize scales and axes for the new chart


    updateTimelineVisualization();
});


//update vis function
function updateTimelineVisualization() {
    const groupedData_timeline = d3.group(filtered_date_data_timeline, d => d.last_name);
    let column_timeline = 'volume';
    if(column_timeline==='volume') {
        // Aggregate by week for each candidate
        aggregatedData_timeline = Array.from(groupedData_timeline, ([key, values]) => {
            const weeklyData_timeline = d3.timeWeek.every(2).range(
                d3.min(values, d => d.date),
                d3.max(values, d => d.date)
            ).map(week => {
                const filtered_timeline = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
                const count_timeline = d3.count(filtered_timeline, d => d.label);
                return { date: week, label: count_timeline };
            });
            return { candidate: key, values: weeklyData_timeline };
        });
    }
    else {
        // Aggregate by week for each candidate
        aggregatedData_timeline = Array.from(groupedData_timeline, ([key, values]) => {
            const weeklyData_timeline = d3.timeWeek.every(2).range(
                d3.min(values, d => d.date),
                d3.max(values, d => d.date)
            ).map(week => {
                const filtered_timeline = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
                const average_timeline = d3.mean(filtered_timeline, d => d.label);
                return { date: week, label: average_timeline };
            });
            return { candidate: key, values: weeklyData_timeline };
        });
    }

    // Define line generator
    const line_timeline = d3.line()
        .x(d => timelineXScale(d.date))
        .y(d => timelineYScale(d.label));

    console.log(aggregatedData_timeline)

    // Draw lines
    timelineSvg.selectAll('.line')
        .data(aggregatedData_timeline)
        .enter().append('path')
        .attr('class', 'line')
        .attr('d', d => line_timeline(d.values))
        .style('stroke', (d, i) => d3.schemeCategory10[i])
        .style('stroke-width', 3)
        .style('fill', 'none'); // Ensure that fill is set to none

    // Update scales domain based on aggregatedData
    timelineXScale.domain([d3.min(aggregatedData_timeline, d => d3.min(d.values, v => v.date)), d3.max(aggregatedData_timeline, d => d3.max(d.values, v => v.date))]);
    timelineYScale.domain([0, d3.max(aggregatedData_timeline, d => d3.max(d.values, v => v.label))]);

    // Transition for x-axis and y-axis
    timelineXAxis.transition().duration(500).call(d3.axisBottom(timelineXScale));
    timelineYAxis.transition().duration(500).call(d3.axisLeft(timelineYScale));

    // Select and update circles for data points
    const points_timeline = timelineSvg.selectAll('.point-group')
        .data(aggregatedData_timeline);

    // Remove exiting point groups
    points_timeline.exit().remove();

    // Enter new point groups and append circles
    const newPoints_timeline = points_timeline.enter().append('g').attr('class', 'point-group');

    // Merge existing and new points
    const allPoints_timeline = newPoints_timeline.merge(points_timeline);

    // Update circles for data points
    const circles_timeline = allPoints_timeline.selectAll('circle')
        .data(d => d.values);

    circles_timeline.exit().remove(); // Remove circles that no longer have data

    // circles_timeline.enter().append('circle')
    //     .merge(circles_timeline)
    //     .attr('class', 'datapoint')
    //     .attr('cx', d => timelineXScale(d.date))
    //     .attr('cy', d => timelineYScale(d.label))
    //     .attr('r', 4)
    //     .style('fill', 'white') // Filling circles with white color
    //     .style('stroke', 'grey') // Adding black stroke
    //     .style('stroke-width', 1); // Adjusting stroke width as needed

    // Select existing lines and apply data to update/exit selection
    const lines_timeline = timelineSvg.selectAll('.line').data(aggregatedData_timeline);

    // Remove exiting lines
    lines_timeline.exit().remove();

    // Update existing lines with transition
    lines_timeline.transition().duration(500)
        .attr('d', d => line_timeline(d.values))
        .style('stroke', (d) => colorScale_timeline(d.candidate)) // Use color scale for line stroke
        .style('stroke-width', 3) // Adjusting stroke width as needed
        .style('fill', 'none'); // Again, ensure that fill is set to none


    // Append new lines with transition
    lines_timeline.enter().append('path')
        .attr('class', 'line')
        .attr('d', d => line_timeline(d.values))
        .style('stroke', (d) => colorScale_timeline(d.candidate)) // Use color scale for line stroke
        .style('stroke-width', 3)
        .style('opacity', 0)
        .transition().duration(500)
        .style('opacity', 1);

}

