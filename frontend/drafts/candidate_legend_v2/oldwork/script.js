// const events = [
//     {
//         name: "Former US President Trump accused of mishandling classified documents",
//         date: "20230608",
//         description: "Former US President Donald Trump was formally accused of mishandling classified documents."
//     },
//     {
//         name: "OceanGate's Titan submersible implosion",
//         date: "20230618",
//         description: "OceanGate’s Titan submersible imploded during an expedition to the Titanic, resulting in the loss of all onboard."
//     },
//     {
//         name: "Trump arrested, booked, and released in Georgia election case",
//         date: "20230824",
//         description: "Trump arrested, booked and released at Fulton County Jail in Georgia election case."
//     },
//     {
//         name: "Hamas-led attack on Israel",
//         date: "20231007",
//         description: "2023 Hamas-led attack on Israel."
//     },
//     {
//         name: "Republican Debate in Milwaukee, Wisconsin",
//         date: "20230823",
//         description: "Republican Party Debate held in Milwaukee, Wisconsin."
//     },
//     {
//         name: "Republican Debate in Simi Valley, California",
//         date: "20230927",
//         description: "Republican Party Debate held in Simi Valley, California."
//     },
//     {
//         name: "Republican Debate in Miami, Florida",
//         date: "20231108",
//         description: "Republican Party Debate held in Miami, Florida."
//     }
// ];
//
// // // Assuming your events array is named 'events'
// // window.onload = function() {
// //     let select = document.getElementById('event-selection');
// //
// //     events.forEach(event => {
// //         let option = document.createElement('option');
// //         option.value = event.date;
// //         option.text = event.name + ' (' + event.date + ')';
// //         select.appendChild(option);
// //         console.log("option", option.text)
// //     });
// // };
//
//
// // List of candidates to include in viz
// //boolean that denotes whether a circle is grey (True = do not include include in viz, False = include in viz)
//
// let selected_candidates = ["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"];
//
// let candidateStatus = {
//     "biden": true, "christie": true, "desantis": true, "haley": true,
//     "kennedy": true, "pence": true, "ramaswamy": true, "scott": true,
//     "trump": true, "williamson": true
// };
//
//
// // // Constant Color Scale
// const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selected_candidates)
// // console.log(colorScale("biden"))
// let is_grey = false;
// let data = [];
// let xScale, yScale, xAxis, yAxis, filtered_date_data;
//
// // set margins, width, height
// let margin = {top: 40, right: 40, bottom: 60, left: 60};
//
// let width = 650 - margin.left - margin.right;
// let height = 400 - margin.top - margin.bottom;
//
// let parseDate = d3.timeParse("%Y-%m-%d")
//
//
// // initialize svg drawing space
// let svg = d3.select("#impact-event-chart-area").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
// // Initialize legend container at the top right corner of the chart
// let legend = svg.append("g")
//     .attr("class", "legend")
//     .attr("transform", `translate(${width - 80}, 0)`);
//
//
// //update vis function
// function updateVisualization() {
//     console.log("updateVisualization ran")
//     // remove any existing elements
//     svg.selectAll('.line-extension').remove();
//     svg.selectAll('.line-extension-label').remove();
//     svg.selectAll('.lines').remove();
//     svg.selectAll('.circles').remove();
//     svg.selectAll('.points').remove();
//     // Remove existing lines before redrawing
//     svg.selectAll('.line').remove();
//     svg.selectAll('.point-group').remove();
//     svg.selectAll('.linelabel').remove();
//     // // Remove exiting lines
//     // lines.exit().remove();
//     // circles.exit().remove(); // Remove circles that no longer have data
//     // // Remove exiting point groups
//     // points.exit().remove();
//
//     // Additional code to set the date range based on the selected event // 2023-08-01
//     //let selectedEvent = d3.select('#event-selection option:checked').text() //document.getElementById("event-selection").value || '2023-08-01'; //d3.select('#event-selection option:checked').text()
//     //let eventDate = d3.select('#event-selection option:checked').property("value");//parseDate(selectedEvent);
//     let selectedEvent = '20230721';
//     let eventDate = selectedEvent;
//     console.log("eventDate", eventDate)
//     let startDate = d3.timeDay.offset(eventDate, -14); // 2 weeks before the event
//     let endDate = d3.timeDay.offset(eventDate, 14); // 2 weeks after the event
//     //addEventLine(eventDate, selectedEvent);
//     //updateEventLine();
//     // console.log("selectedEventtttttt",  d3.select('#event-selection option:checked').property("value"))
//
//
//
//     filtered_date_data = data.filter(d => d.date >= startDate && d.date <= endDate);
//
//     // filter data to only include selected candidates
//     let filteredData = filtered_date_data.filter(d => candidateStatus[d.last_name.toLowerCase()]);
//
//     // Get the selected attribute from the dropdown
//     let column = document.getElementById("line-stat-selection-impact").value;
//     // Group data by candidate
//     const groupedData = d3.group(filteredData, d => d.last_name)
//     console.log("groupedData", groupedData)
//     // Get desired dependent variable and aggregated data
//     let aggregatedData;
//
//     if(column==='volume') {
//         // Aggregate by week for each candidate
//         aggregatedData = Array.from(groupedData, ([key, values]) => {
//             const weeklyData = d3.timeDay.every(1).range(
//                 d3.min(values, d => d.date),
//                 d3.max(values, d => d.date)
//             ).map(week => {
//                 const filtered = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
//                 const average = d3.count(filtered, d => d.label);
//                 return { date: week, label: average };
//             });
//             return { candidate: key, values: weeklyData };
//         });
//     }
//     else {
//         // Aggregate by week for each candidate
//         aggregatedData = Array.from(groupedData, ([key, values]) => {
//             const weeklyData = d3.timeDay.every(1).range(
//                 d3.min(values, d => d.date),
//                 d3.max(values, d => d.date)
//             ).map(week => {
//                 const filtered = values.filter(d => d.date >= week && d.date < d3.timeWeek.offset(week, 2));
//                 const average = d3.mean(filtered, d => d.label);
//                 return { date: week, label: average };
//             });
//             return { candidate: key, values: weeklyData };
//         });
//     }
//
//     // Update scales domain based on aggregatedData
//     xScale.domain([d3.min(aggregatedData, d => d3.min(d.values, v => v.date)), d3.max(aggregatedData, d => d3.max(d.values, v => v.date))]);
//     yScale.domain([0, d3.max(aggregatedData, d => d3.max(d.values, v => v.label))]);
//
//     // Transition for x-axis and y-axis
//     xAxis.transition().duration(500).call(d3.axisBottom(xScale));
//     yAxis.transition().duration(500).call(d3.axisLeft(yScale));
//
//     // Draw lines with new filteredData
//     // Define line generator
//     const line = d3.line()
//         .x(d => xScale(d.date))
//         .y(d => yScale(d.label));
//
//     // Draw lines
//     svg.selectAll('.line')
//         .data(aggregatedData)
//         .enter().append('path')
//         .attr('class', 'line')
//         .attr('d', d => line(d.values))
//         // .style('stroke', d => colorScale(d.candidate)) // Use candidate name for color
//         .style('stroke', d => colorScale(d.candidate))
//         .style('stroke-width', 5);
//
//     //direct legence start
//     // Sort the aggregated data based on the last Y-value of each line in descending order
//     aggregatedData.sort((a, b) => {
//         let lastY_A = yScale(a.values[a.values.length - 1].label);
//         let lastY_B = yScale(b.values[b.values.length - 1].label);
//         return lastY_B - lastY_A; // Note the reversed order here
//     });
//
//     let lastLabelYPositions = [];
//
//     aggregatedData.forEach((d, i) => {
//         let lastPoint = d.values[d.values.length - 1];
//         let labelY = yScale(lastPoint.label);
//
//         // Find the highest position that does not overlap
//         for (let pos of lastLabelYPositions) {
//             if (labelY >= pos - 20) {
//                 labelY = pos - 20; // Move the label up by 20 units; adjust as needed
//             }
//         }
//
//         lastLabelYPositions.push(labelY); // Store the position of this label
//
//         // Draw the extension line
//         svg.append('line')
//             .attr('class', 'line-extension')
//             .attr('x1', xScale(lastPoint.date))
//             .attr('y1', yScale(lastPoint.label))
//             .attr('x2', width - 8)
//             .attr('y2', labelY) // Adjusted y position
//             .style('stroke', colorScale(d.candidate))
//             .style('stroke-width', 1)
//             .style('stroke-dasharray', '3, 3')
//             .style('opacity', 0.5); // Optional: make it dashed;
//
//         // Add label at the end of the extension line
//         svg.append('text')
//             .attr('x', width - 8)
//             .attr('class', 'linelabel')
//             .attr('y', labelY)
//             .attr('dy', '.35em')
//             .text(d.candidate)
//             .style('fill', colorScale(d.candidate))
//             .style('font-size', '8px');
//     });
//     //directlegend end
//
//     // Draw circles next, so they appear on top of the lines
//     const points = svg.selectAll('.point-group')
//         .data(aggregatedData)
//         .enter().append('g').attr('class', 'point-group');
//
//     points.selectAll('circle')
//         .data(d => d.values)
//         .enter().append('circle')
//         .attr('class', 'datapoint')
//         .attr('cx', d => xScale(d.date))
//         .attr('cy', d => yScale(d.label))
//         .attr('r', 3)
//         .style('fill', 'white')
//         .style('stroke', 'grey')
//         .style('stroke-width', 1);
//
//
//     // Select existing lines and apply data to update/exit selection
//     const lines = svg.selectAll('.line').data(aggregatedData);
//
//     // Update existing lines with transition
//     lines.transition().duration(500)
//         .attr('d', d => line(d.values))
//         .style('stroke', (d) => colorScale(d.candidate)) // Use color scale for line stroke
//         .style('fill', 'none'); // Again, ensure that fill is set to none
//
//     // Append new lines with transition
//     lines.enter().append('path')
//         .attr('class', 'line')
//         .attr('d', d => line(d.values))
//         .style('stroke', (d) => colorScale(d.candidate)) // Use color scale for line stroke
//         .style('opacity', 0)
//         .transition().duration(500)
//         .style('opacity', 1);
//
//     // Enter new point groups and append circles
//     const newPoints = points.enter().append('g').attr('class', 'point-group');
//
//     // Merge existing and new points
//     const allPoints = newPoints.merge(points);
//
//     // Update circles for data points
//     const circles = allPoints.selectAll('circle')
//         .data(d => d.values);
//
//     circles.enter().append('circle')
//         .merge(circles)
//         .attr('class', 'datapoint')
//         .attr('cx', d => xScale(d.date))
//         .attr('cy', d => yScale(d.label))
//         .attr('r', 3)
//         .style('fill', 'white') // Filling circles with white color
//         .style('stroke', 'grey') // Adding black stroke
//         .style('stroke-width', 1); // Adjusting stroke width as needed
//
//     console.log("I got to end of updateVisualization")
//     console.log("event-selection", document.getElementById(".event-selection.form-control"))
//     console.log("hi", d3.select('#event-selection option:checked').text)
//
//
//
// }
// // Load CSV file and process data
// d3.csv("data/labeled.csv", row => {
//     // CSV processing logic
//     row.date = parseDate(row.date);
//     return row;
// }).then(csv => {
//     data = csv;
//     // set date data to full range by default
//     filtered_date_data = data;
//
//     // Define x and y scales and axes outside the updateVisualization function
//     xScale = d3.scaleTime().range([0, width - 50]);
//     yScale = d3.scaleLinear().range([height, 0]);
//     xAxis = svg.append('g').attr('transform', `translate(0,${height})`);
//     yAxis = svg.append('g');
//
//     // Define a color scale
//     //const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"])
//
//     // Update the visualization based on a change in selection in the dropdown menu
//     document.getElementById('line-stat-selection-impact').addEventListener('change', function () {
//         // Call the updateVisualization function when the dropdown value changes
//         updateVisualization();
//     });
//
//     // Event listener for the dropdown
//     document.getElementById('event-selection').addEventListener('change', function() {
//         // updateEventLine();  // This will update the event line
//         //updateVisualization();  // This will update the rest of the visualization
//         console.log("eventlister ran", document.getElementById('event-selection'))
//     });
//     // Initial call to update the visualization
//     updateVisualization();
//     console.log("I got here: load csv, then...")
//     // updateLegend();
// });
//
//
//
// // Function to handle candidate image clicks
// function clicked_candidate(src) {
//     let candidate = src.split('/').pop().replace('.png', '');
//     candidateStatus[candidate] = !candidateStatus[candidate];
//     change_color(candidate, candidateStatus[candidate]);
//     updateVisualization();
//     console.log("The clicked_candidate is: ", candidate)
// }
//
//
// function change_color(candidate, isSelected) {
//     let candidateButton = d3.select("#" + candidate + "_button");
//     if (isSelected) {
//         candidateButton.style("background-color", colorScale(candidate))
//             .classed("blurred-image", false);
//     } else {
//         candidateButton.style("background-color", "#a8a8a8")
//             .classed("blurred-image", true);
//     }
// }
//
//
// // Set initial colors for candidate images on page load
// // Initialize each candidate's status to true (selected) on page load
// selected_candidates.forEach(candidate => {
//     candidateStatus[candidate] = true; // Set each candidate's status to true
//     change_color(candidate, candidateStatus[candidate]); // Update color based on status
// });
//
//
// // function addEventLine(eventDate, selectedEvent) {
// //     // Remove existing event line and label if any
// //     svg.selectAll('.event-line, .event-label').remove();
// //
// //     // Calculate x-coordinate for the event line
// //     let eventX = xScale(eventDate);
// //
// //     // Draw the vertical event line
// //     svg.append('line')
// //         .attr('class', 'event-line')
// //         .attr('x1', eventX)
// //         .attr('x2', eventX)
// //         .attr('y1', 0)
// //         .attr('y2', height)
// //         .style('stroke', 'grey')
// //         .style('stroke-width', 1)
// //         .style('stroke-dasharray', '4'); // This makes the line dotted
// //
// //     // Add event label
// //     svg.append('text')
// //         .attr('class', 'event-label')
// //         .attr('x', eventX)
// //         .attr('y', 0)
// //         .attr('text-anchor', 'end') // Adjust text-anchor as needed
// //         .attr('transform', `translate(0, -10)`) // Adjust to position label above the line
// //         .text(selectedEvent)
// //         .style('fill', 'grey')
// //         .style('font-size', '12px');
// // }
//
// // function updateEventLine() {
// //     let selectedEvent = d3.select('#event-selection option:checked').text
// //     let eventDate = d3.select('#event-selection option:checked').property("value")
// //     //let eventName = "Event Name"; // Replace with code to get the actual event name
// //     console.log("selectedEvent", document.getElementById("event-selection").textContent)
// //
// //     addEventLine(eventDate, selectedEvent);
// // }
//
// function adjustTextSize() {
//     const candidateContainers = document.querySelectorAll('.candidate_containers');
//
//     candidateContainers.forEach(container => {
//         const image = container.querySelector('img');
//         const text = container.querySelector('.candidate-name');
//         let fontSize = 14; // Start with a reasonable font size
//
//         // Ensure the image is loaded to get its dimensions
//         if (image.complete) {
//             adjustSize();
//         } else {
//             image.onload = adjustSize;
//         }
//
//         function adjustSize() {
//             const maxWidth = image.offsetWidth; // Get the width of the image
//             text.style.fontSize = fontSize + 'px';
//
//             while (text.offsetWidth > maxWidth && fontSize > 0) {
//                 fontSize -= 0.5; // Decrease font size
//                 text.style.fontSize = fontSize + 'px';
//             }
//         }
//     });
// }
//
// // Call adjustTextSize when the page loads and when it's resized
// window.onload = adjustTextSize;
// window.onresize = adjustTextSize;
//
// // for extension labels
// function isOverlap(label1, label2) {
//     return Math.abs(label1 - label2) < 20; // 20 is the threshold for overlap, adjust as needed
// }

//here end

//
// function updateLegend() {
//     legend.selectAll(".legend-item").remove();
//
//     let activeCandidates = Object.keys(candidateStatus).filter(candidate => candidateStatus[candidate]);
//
//     activeCandidates.forEach((candidate, index) => {
//         let legendItem = legend.append("g")
//             .attr("class", "legend-item")
//             .attr("transform", `translate(0, ${index * 25})`);
//
//         legendItem.append("circle")
//             .attr("r", 5)
//             .style("fill", colorScale(candidate));
//
//         legendItem.append("text")
//             .attr("x", 20)
//             .attr("y", 5)
//             .text(candidate)
//             .style("font-size", "12px")
//             .style("fill", colorScale(candidate));
//     });
// }
//


// function showTooltip(element) {
//     let candidate = element.src.split('/').pop().replace('.png', '');
//     let tooltipText = selected_candidates.includes(candidate) ?
//         `Click to remove ${candidate} from the plot` :
//         `Click to add ${candidate} to the plot`;
//     let tooltip = document.getElementById("tooltip");
//     tooltip.style.display = "block";
//     tooltip.innerHTML = tooltipText;
//     tooltip.style.left = event.pageX + "px";
//     tooltip.style.top = event.pageY + "px";
// }
//
// function hideTooltip() {
//     document.getElementById("tooltip").style.display = "none";
// }



//
// List of candidates to include in viz
//boolean that denotes whether a circle is grey (True = do not include include in viz, False = include in viz)

let selected_candidates = ["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"];

let candidateStatus = {
    "biden": true, "christie": true, "desantis": true, "haley": true,
    "kennedy": true, "pence": true, "ramaswamy": true, "scott": true,
    "trump": true, "williamson": true
};


// // Constant Color Scale
const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selected_candidates)
// console.log(colorScale("biden"))
let is_grey = false;
let data = [];
let xScale, yScale, xAxis, yAxis, filtered_date_data;

// set margins, width, height
let margin = {top: 40, right: 40, bottom: 60, left: 60};

let width = 650 - margin.left - margin.right;
let height = 400 - margin.top - margin.bottom;

let parseDate = d3.timeParse("%Y%m%d")


// initialize svg drawing space
let svg = d3.select("#impact-event-chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Initialize legend container at the top right corner of the chart
let legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 80}, 0)`);


//update vis function
function updateVisualization() {
    // Additional code to set the date range based on the selected event
    let selectedEvent = document.getElementById("event-selection").value || '2023-08-01';
    let eventDate = parseDate(selectedEvent);
    let startDate = d3.timeDay.offset(eventDate, -14); // 2 weeks before the event
    let endDate = d3.timeDay.offset(eventDate, 14); // 2 weeks after the event
    // selectedevent should be replace with actual event name
    updateEventLine();
    addEventLine(eventDate, "Republican Primary");
    svg.selectAll('.line-extension').remove();
    svg.selectAll('.line-extension-label').remove();
    // console.log("selectedEvent", selectedEvent)
    // console.log("eventDate", eventDate)
    // console.log("startDate", startDate)
    // console.log("endDate", endDate)


    filtered_date_data = data.filter(d => d.date >= startDate && d.date <= endDate);

    // Remove existing lines before redrawing
    svg.selectAll('.line').remove();

    // filter data to only include selected candidates
    let filteredData = filtered_date_data.filter(candidate => {
        return selected_candidates.includes(candidate.last_name.toLowerCase());
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
            const weeklyData = d3.timeDay.every(1).range(
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
            const weeklyData = d3.timeDay.every(1).range(
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

    // Draw lines with new filteredData
    // Define line generator
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.label));

    // Draw lines
    svg.selectAll('.line')
        .data(aggregatedData)
        .enter().append('path')
        .attr('class', 'line')
        .attr('d', d => line(d.values))
        // .style('stroke', d => colorScale(d.candidate)) // Use candidate name for color
        .style('fill', d => colorScale(d.candidate))
        .style('stroke-width', 5);




    // Update scales domain based on aggregatedData
    xScale.domain([d3.min(aggregatedData, d => d3.min(d.values, v => v.date)), d3.max(aggregatedData, d => d3.max(d.values, v => v.date))]);
    yScale.domain([0, d3.max(aggregatedData, d => d3.max(d.values, v => v.label))]);

    // Transition for x-axis and y-axis
    xAxis.transition().duration(500).call(d3.axisBottom(xScale));
    yAxis.transition().duration(500).call(d3.axisLeft(yScale));

    // Select and update circles for data points
    const points = svg.selectAll('.point-group')
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
    const lines = svg.selectAll('.line').data(aggregatedData);

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

    ///////direct legend (start)
    // // Inside your updateVisualization function, after drawing the lines
    // aggregatedData.forEach((d, i) => {
    //     let lastPoint = d.values[d.values.length - 1]; // Get the last point of the line
    //
    //     // Draw an extension line
    //     svg.append('line')
    //         .attr('class', 'line-extension')
    //         .attr('x1', xScale(lastPoint.date))
    //         .attr('y1', yScale(lastPoint.label))
    //         .attr('x2', width) // Extend to the right edge of the graph
    //         .attr('y2', yScale(lastPoint.label))
    //         .style('stroke', colorScale(d.candidate))
    //         .style('stroke-width', 2)
    //         .style('stroke-dasharray', '3, 3'); // Optional: make it dashed
    // });
    //
    // // Continue in the updateVisualization function
    // aggregatedData.forEach((d, i) => {
    //     let lastPoint = d.values[d.values.length - 1]; // Get the last point of the line
    //
    //     // Add label at the end of the extension line
    //     svg.append('text')
    //         .attr('x', width + 5) // A little to the right of the graph's edge
    //         .attr('y', yScale(lastPoint.label))
    //         .attr('dy', '.35em') // To vertically center the text
    //         .text(d.candidate)
    //         .style('fill', colorScale(d.candidate))
    //         .style('font-size', '12px');
    // });
    // let lastLabelYPositions = [];
    //
    // aggregatedData.forEach((d, i) => {
    //     let lastPoint = d.values[d.values.length - 1];
    //     let labelY = yScale(lastPoint.label);
    //
    //     // Check for overlap and adjust position
    //     lastLabelYPositions.forEach(pos => {
    //         if (isOverlap(labelY, pos)) {
    //             labelY = pos - 20; // Move the label up by 20 units; adjust as needed
    //         }
    //     });
    //
    //     lastLabelYPositions.push(labelY); // Store the position of this label
    //
    //     // Draw the extension line
    //     svg.append('line')
    //         .attr('class', 'line-extension')
    //         .attr('x1', xScale(lastPoint.date))
    //         .attr('y1', yScale(lastPoint.label))
    //         .attr('x2', width)
    //         .attr('y2', labelY) // Adjusted y position
    //         .style('stroke', colorScale(d.candidate))
    //         .style('stroke-width', 2)
    //         .style('stroke-dasharray', '3, 3');
    //
    //     // Add label at the end of the extension line
    //     svg.append('text')
    //         .attr('x', width + 5)
    //         .attr('y', labelY)
    //         .attr('dy', '.35em')
    //         .text(d.candidate)
    //         .style('fill', colorScale(d.candidate))
    //         .style('font-size', '12px');
    // });
    // Sort the aggregated data based on the last Y-value of each line in descending order
    aggregatedData.sort((a, b) => {
        let lastY_A = yScale(a.values[a.values.length - 1].label);
        let lastY_B = yScale(b.values[b.values.length - 1].label);
        return lastY_B - lastY_A; // Note the reversed order here
    });

    let lastLabelYPositions = [];

    aggregatedData.forEach((d, i) => {
        let lastPoint = d.values[d.values.length - 1];
        let labelY = yScale(lastPoint.label);

        // Find the highest position that does not overlap
        for (let pos of lastLabelYPositions) {
            if (labelY >= pos - 20) {
                labelY = pos - 20; // Move the label up by 20 units; adjust as needed
            }
        }

        lastLabelYPositions.push(labelY); // Store the position of this label

        // Draw the extension line
        svg.append('line')
            .attr('class', 'line-extension')
            .attr('x1', xScale(lastPoint.date))
            .attr('y1', yScale(lastPoint.label))
            .attr('x2', width - 8)
            .attr('y2', labelY) // Adjusted y position
            .style('stroke', colorScale(d.candidate))
            .style('stroke-width', 1)
            .style('stroke-dasharray', '3, 3')
            .style('opacity', 0.5); // Optional: make it dashed;

        // Add label at the end of the extension line
        svg.append('text')
            .attr('x', width - 8)
            .attr('y', labelY)
            .attr('dy', '.35em')
            .text(d.candidate)
            .style('fill', colorScale(d.candidate))
            .style('font-size', '8px');
    });





    ///////direct legend (end)


}
// Load CSV file and process data
d3.csv("data/labeled.csv", row => {
    // CSV processing logic
    row.date = parseDate(row.date);
    return row;
}).then(csv => {
    data = csv;
    // set date data to full range by default
    filtered_date_data = data;

    // Define x and y scales and axes outside the updateVisualization function
    xScale = d3.scaleTime().range([0, width - 50]);
    yScale = d3.scaleLinear().range([height, 0]);
    xAxis = svg.append('g').attr('transform', `translate(0,${height})`);
    yAxis = svg.append('g');

    // Define a color scale
    //const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"])

    // Update the visualization based on a change in selection in the dropdown menu
    document.getElementById('line-stat-selection-impact').addEventListener('change', function () {
        // Call the updateVisualization function when the dropdown value changes
        updateVisualization();
    });

    // Event listener for the dropdown
    document.getElementById('event-selection').addEventListener('change', function() {
        updateEventLine();  // This will update the event line
        updateVisualization();  // This will update the rest of the visualization
    });
    // Initial call to update the visualization
    updateVisualization();
    // updateLegend();
});



// Function to handle candidate image clicks
function clicked_candidate(src) {
    let candidate = src.split('/').pop().replace('.png', '');
    candidateStatus[candidate] = !candidateStatus[candidate];
    change_color(candidate, candidateStatus[candidate]);
    updateVisualization();
    // updateLegend();
}

function change_color(candidate, isSelected) {
    let candidateButton = d3.select("#" + candidate + "_button");
    if (isSelected) {
        candidateButton.style("background-color", colorScale(candidate))
            .classed("blurred-image", false);
    } else {
        candidateButton.style("background-color", "#a8a8a8")
            .classed("blurred-image", true);
    }
}


// Set initial colors for candidate images on page load
// Initialize each candidate's status to true (selected) on page load
selected_candidates.forEach(candidate => {
    candidateStatus[candidate] = true; // Set each candidate's status to true
    change_color(candidate, candidateStatus[candidate]); // Update color based on status
});


function addEventLine(eventDate, eventName) {
    // Remove existing event line and label if any
    svg.selectAll('.event-line, .event-label').remove();

    // Calculate x-coordinate for the event line
    let eventX = xScale(eventDate);

    // Draw the vertical event line
    svg.append('line')
        .attr('class', 'event-line')
        .attr('x1', eventX)
        .attr('x2', eventX)
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', 'grey')
        .style('stroke-width', 1)
        .style('stroke-dasharray', '4'); // This makes the line dotted

    // Add event label
    svg.append('text')
        .attr('class', 'event-label')
        .attr('x', eventX)
        .attr('y', 0)
        .attr('text-anchor', 'end') // Adjust text-anchor as needed
        .attr('transform', `translate(0, -10)`) // Adjust to position label above the line
        .text(eventName)
        .style('fill', 'grey')
        .style('font-size', '12px');
}

function updateEventLine() {
    let selectedEvent = document.getElementById("event-selection").value;
    let eventDate = parseDate(selectedEvent);
    let eventName = "Event Name"; // Replace with code to get the actual event name

    addEventLine(eventDate, eventName);
}

function adjustTextSize() {
    const candidateContainers = document.querySelectorAll('.candidate_containers');

    candidateContainers.forEach(container => {
        const image = container.querySelector('img');
        const text = container.querySelector('.candidate-name');
        let fontSize = 14; // Start with a reasonable font size

        // Ensure the image is loaded to get its dimensions
        if (image.complete) {
            adjustSize();
        } else {
            image.onload = adjustSize;
        }

        function adjustSize() {
            const maxWidth = image.offsetWidth; // Get the width of the image
            text.style.fontSize = fontSize + 'px';

            while (text.offsetWidth > maxWidth && fontSize > 0) {
                fontSize -= 0.5; // Decrease font size
                text.style.fontSize = fontSize + 'px';
            }
        }
    });
}

// Call adjustTextSize when the page loads and when it's resized
window.onload = adjustTextSize;
window.onresize = adjustTextSize;

// for extension labels
function isOverlap(label1, label2) {
    return Math.abs(label1 - label2) < 20; // 20 is the threshold for overlap, adjust as needed
}



//
// function updateLegend() {
//     legend.selectAll(".legend-item").remove();
//
//     let activeCandidates = Object.keys(candidateStatus).filter(candidate => candidateStatus[candidate]);
//
//     activeCandidates.forEach((candidate, index) => {
//         let legendItem = legend.append("g")
//             .attr("class", "legend-item")
//             .attr("transform", `translate(0, ${index * 25})`);
//
//         legendItem.append("circle")
//             .attr("r", 5)
//             .style("fill", colorScale(candidate));
//
//         legendItem.append("text")
//             .attr("x", 20)
//             .attr("y", 5)
//             .text(candidate)
//             .style("font-size", "12px")
//             .style("fill", colorScale(candidate));
//     });
// }
//


// function showTooltip(element) {
//     let candidate = element.src.split('/').pop().replace('.png', '');
//     let tooltipText = selected_candidates.includes(candidate) ?
//         `Click to remove ${candidate} from the plot` :
//         `Click to add ${candidate} to the plot`;
//     let tooltip = document.getElementById("tooltip");
//     tooltip.style.display = "block";
//     tooltip.innerHTML = tooltipText;
//     tooltip.style.left = event.pageX + "px";
//     tooltip.style.top = event.pageY + "px";
// }
//
// function hideTooltip() {
//     document.getElementById("tooltip").style.display = "none";
// }
