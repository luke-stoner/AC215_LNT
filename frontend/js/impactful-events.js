let previousSelectedSettings = [
  { candidates: [], event: "20230801", metric: "volume" },
];

function initializeDashboard() {
  // Update: Removed Kennedy and Williamson from the list
  let selected_candidates = [
    "biden",
    "christie",
    "desantis",
    "haley",
    "pence",
    "ramaswamy",
    "scott",
    "trump",
  ];
  let candidateStatus = {
    biden: true,
    christie: false,
    desantis: true,
    haley: true,
    pence: false,
    ramaswamy: false,
    scott: false,
    trump: true,
  };

  //let is_grey = false;
  let data = [];
  let xScale, yScale, xAxis, yAxis, filtered_date_data;

  // set margins, width, height
  let margin = { top: 40, right: 40, bottom: 40, left: 53 };
  let width = 900 - margin.left - margin.right;
  let height = 400 - margin.top - margin.bottom;

  let parseDate = d3.timeParse("%Y%m%d");

  // initialize svg drawing space
  let svg = d3
    .select("#impact-event-chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Initialize legend container at the top right corner of the chart
  let legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 80}, 0)`);

  //update vis function
  function updateVisualization() {
    // showLoadingIcon();
    svg.selectAll(".line-group").remove();
    svg.selectAll(".line-extension").remove();
    svg.selectAll(".line-extension-label").remove();

    // Additional code to set the date range based on the selected event
    let selectedEvent =
      document.getElementById("event-selection").value || "20230801";
    let eventDate = parseDate(selectedEvent);
    let startDate = d3.timeDay.offset(eventDate, -14); // 2 weeks before the event
    let endDate = d3.timeDay.offset(eventDate, 15); // 2 weeks after the event
    let labelEndDate = d3.timeDay.offset(eventDate, 14);
    let midpoint1 = calculateMidpoint(startDate, eventDate);
    let midpoint2 = calculateMidpoint(eventDate, labelEndDate);
    let eventName = d3.select("#event-selection option:checked").text();
    console.log("eventDate", eventDate);
    console.log("selectedEvent", selectedEvent);

    let filtered_date_data = data.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );

    // filter data to only include selected candidates
    let filteredData = filtered_date_data.filter(
      (d) => candidateStatus[d.last_name.toLowerCase()]
    );
    // Group data by candidate
    const groupedData = d3.group(filteredData, (d) => d.last_name);

    // Get the selected attribute from the dropdown
    let column = document.getElementById("line-stat-selection-impact").value;

    // Aggregate data for each day
    let aggregatedData = Array.from(groupedData, ([key, values]) => {
      const dailyData = d3.timeDay
        .range(startDate, d3.timeDay.offset(endDate, 0))
        .map((day) => {
          const filtered = values.filter(
            (d) => d.date.getTime() === day.getTime()
          );
          let metric;
          if (column === "volume") {
            metric = d3.count(filtered, (d) => d.label); // Use appropriate metric calculation
          } else {
            metric = d3.mean(filtered, (d) => d.label); // Or another calculation
          }
          return { date: day, label: metric };
        });
      return { candidate: key, values: dailyData };
    });
    xScale.domain([startDate, endDate]);
    yScale.domain([
      0,
      d3.max(aggregatedData, (d) => d3.max(d.values, (v) => v.label)),
    ]);

    updateEventLine();
    addEventLine(eventDate, eventName);
    let tickValues = [startDate, midpoint1, eventDate, midpoint2, labelEndDate];

    // Transition for x-axis and y-axis
    xAxis
      .transition()
      .duration(500)
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat((d) => {
            let formatMonth = d.getMonth() + 1; // getMonth() returns 0-11
            let formatDay = d.getDate(); // getDate() returns 1-31
            return `${formatMonth}/${formatDay}`; // Format without leading zeros
          })
      );

    if (column === 'volume') {
      // Define your y-axis transition and call
      yAxis.transition().duration(500).call(d3.axisLeft(yScale))
          .attr("class", "y-axis");

      // Remove existing y-axis text
      svg.select(".y-axis-title").remove();

      // Append axis text
      svg.append("text")
          .attr("class", "y-axis-title")
          .attr("transform", `translate(${margin.left / 2 - 63},${height / 2}) rotate(-90)`)
          .style("text-anchor", "middle")
          .text("Number of Mentions");
    }

    else {
      // Define y axis
      yAxis.transition().duration(500).call(d3.axisLeft(yScale).tickFormat(d3.format(".0%")))
          .attr("class", "y-axis");

      // Remove existing y-axis text
      svg.select(".y-axis-title").remove();

      // Append axis text
      svg.append("text")
          .attr("class", "y-axis-title")
          .attr("transform", `translate(${margin.left / 2 - 63},${height / 2}) rotate(-90)`) // Adjust the position as needed
          .style("text-anchor", "middle")
          .text("Positive Mentions");
    }

    // Custom Line Generator
    function customLine(data) {
      let path = "";
      let previousValidPoint = null;

      data.forEach((d, i) => {
        if (d.label != null) {
          if (previousValidPoint == null) {
            // First valid point, move to this point
            path += `M${xScale(d.date)},${yScale(d.label)} `;
          } else {
            // Draw line from the previous valid point to this point
            path += `L${xScale(d.date)},${yScale(d.label)} `;
          }
          previousValidPoint = d;
        }
      });

      return path;
    }

    // Draw lines and circles within each group
    const lineGroups = svg
      .selectAll(".line-group")
      .data(aggregatedData)
      .enter()
      .append("g")
      .attr("class", "line-group");
    // Draw lines for each group using the custom line generator
    lineGroups
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => customLine(d.values))
      .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()])
      .style("fill", "none")
      .style("stroke-width", 2);

    // Draw circles for each group (only for days with data)
    lineGroups.each(function (d) {
      d3.select(this)
        .selectAll("circle")
        .data(d.values.filter((v) => v.label != null)) // Filter out null values
        .enter()
        .append("circle")
        .attr("class", "datapoint")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.label))
        .attr("r", 3)
        .attr("data-candidate", d.candidate) // Storing candidate name
        .style("fill", candidateColorMap[d.candidate.toLowerCase()])
        .style("stroke", candidateColorMap[d.candidate.toLowerCase()])
        .style("stroke-width", 1);
    });

    //Event Handlers for mouseover and mouseout
    lineGroups
      .selectAll(".line, .datapoint")
      .on("mouseover", function (event, d) {
        console.log("Hovering over:", d.candidate); // Debugging line
        highlightLine(d.candidate);
        bringToFront(d.candidate);
      })
      .on("mouseout", restoreLines);
    // Tooltip Div Selection
    let tooltip = d3.select(".tooltip-lastslide");

    // Event Handlers for mouseover and mouseout
    lineGroups
      .selectAll(".datapoint")
      .on("mouseover", function (event, d) {
        var candidateName = d3.select(this).attr("data-candidate");
        var dataValue = d.label; // Assuming 'label' holds the numerical value you want to display
        var selectedMetric = document.getElementById(
          "line-stat-selection-impact"
        ).value; // Get the selected metric's name
        var date = d.date; // Assuming 'date' holds the date value

        // Format the date (e.g., "April 1, 2021")
        var formattedDate = d3.timeFormat("%B %d, %Y")(date);
        // Check if dataValue is a floating-point number and format it accordingly
        var formattedDataValue =
          dataValue % 1 !== 0 ? parseFloat(dataValue).toFixed(2) : dataValue;

        // Update tooltip content with candidate name in bold and colored
        if (column==='volume') {
          tooltip
              .html(
                  `<strong style='color: ${
                      candidateColorMap[candidateName.toLowerCase()]
                  };'>${candidateName}</strong><br/>Number of Mentions: ${formattedDataValue}<br/>Date: ${formattedDate}`
              )
              .style("opacity", 1)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 10 + "px");
        }
        else {
          tooltip
              .html(
                  `<strong style='color: ${
                      candidateColorMap[candidateName.toLowerCase()]
                  };'>${candidateName}</strong><br/>Positive Mentions: ${d3.format(".0%")(formattedDataValue)}<br/>Date: ${formattedDate}`
              )
              .style("opacity", 1)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 10 + "px");
        }

        highlightLine(candidateName);
        bringToFront(candidateName);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
        restoreLines();
      });

    console.log("candidateStatus", candidateStatus);
    // Highlight line and circles on mouseover
    function highlightLine(candidateName) {
      svg.selectAll(".line, .datapoint").classed("dimmed", true); // Dim all lines and points
      svg
        .selectAll(".line-group")
        .filter((d) => d.candidate === candidateName)
        .selectAll(".line, .datapoint")
        .classed("highlighted", true); // Highlight specific line and points
      // Add hovered class to the corresponding image
      let candidateNameLower = candidateName.toLowerCase();
      d3.select(`#${candidateNameLower}_button`)
        .node()
        .parentNode.classList.add("hovered"); // circle image
      timelineSvg.selectAll(".line").classed("dimmed", true);
      timelineSvg
        .selectAll(".line")
        .filter((d) => d.candidate === candidateName)
        .classed("highlighted", true);
    }

    // Restore original styles on mouseout
    function restoreLines() {
      svg
        .selectAll(".line, .datapoint")
        .classed("highlighted", false)
        .classed("dimmed", false);
      // Remove hovered class from all candidate containers (images)
      d3.selectAll(".candidate_containers").classed("hovered", false); //circle image
      timelineSvg
        .selectAll(".line")
        .classed("highlighted", false)
        .classed("dimmed", false);
      // Re-append the overlay rectangles to ensure they are on top
      timelineSvg.selectAll(".line").lower();
    }

    // Bring a specific line to the front
    function bringToFront(candidateName) {
      svg
        .selectAll(".line-group")
        .filter((d) => d.candidate === candidateName)
        .raise();
      timelineSvg
        .selectAll(".line")
        .filter((d) => d.candidate === candidateName)
        .raise();
    }
    // Add mouseover and mouseout events to candidate images
    d3.selectAll(".candidate_containers img")
      .on("mouseover", function () {
        // Extract the candidate name from the image's ID or another attribute
        var candidateName = d3.select(this).attr("id").replace("_button", "");
        console.log("candidateName before lowercase", candidateName);
        candidateName = capitalizeFirstLetter(candidateName);
        if (candidateName === "Desantis") {
          candidateName = "DeSantis";
        }
        console.log(candidateName);
        //d3.select(this).querySelector('.candidate-name');

        // Highlight the corresponding line and datapoints in the chart
        highlightLine(candidateName);
        bringToFront(candidateName);
      })
      .on("click", function () {
        src = d3.select(this).attr("src");
        clicked_candidate(src);
        console.log("onclickmethod", src);
      })
      .on("mouseout", function () {
        // Restore the chart to its original state
        restoreLines();
      });

    aggregatedData.sort((a, b) => {
      let lastY_A = yScale(a.values[a.values.length - 1].label);
      let lastY_B = yScale(b.values[b.values.length - 1].label);
      return lastY_B - lastY_A;
    });

    let lastLabelYPositions = [];

    aggregatedData.forEach((d, i) => {
      let lastPoint = d.values[d.values.length - 1];

      // Check if the last data point is valid
      if (lastPoint.label != null) {
        let labelY = yScale(lastPoint.label);

        // Adjust for bottom overlap
        for (let pos of lastLabelYPositions) {
          if (labelY >= pos - 20) {
            labelY = pos - 20;
          }
        }

        lastLabelYPositions.push(labelY);

        // Draw the extension line
        svg
          .append("line")
          .attr("class", "line-extension")
          .attr("x1", xScale(lastPoint.date))
          .attr("y1", yScale(lastPoint.label))
          .style("stroke", candidateColorMap[d.candidate.toLowerCase()])
          .attr("x2", width - 8)
          .transition()
          .duration(1000)
          .attr("y2", labelY)
          .style("stroke-width", 5)
          .style("stroke-dasharray", "3, 3")
          .style("opacity", 0.5);

        // Add label at the end of the extension line
        svg
          .append("text")
          .attr("class", "line-extension-label")
          .attr("x", width - 8)
          .style("fill", candidateColorMap[d.candidate.toLowerCase()])
          .style("font-size", "8px")
          .attr("dy", ".35em")
          .text(d.candidate)
          .transition()
          .duration(1000)
          .attr("y", labelY);
      }
    });

    updateDynamicTitle(); //updateFullTimelineChart(groupedData, column)
    updateTimelineVisualization(startDate, endDate, column);
    // hideLoadingIcon();
  }
  // Load CSV file and process data
  d3.csv("data/labeled.csv", (row) => {
    // CSV processing logic
    row.date = parseDate(row.date);
    return row;
  }).then((csv) => {
    data = csv;
    // set date data to full range by default
    filtered_date_data_timeline = data;
    filtered_date_data = data;

    // Define x and y scales and axes outside the updateVisualization function
    xScale = d3.scaleTime().range([0, width - 50]);
    yScale = d3.scaleLinear().range([height, 0]);
    xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d"))); // This line sets the format to month/day
    yAxis = svg.append("g");


    // Update the visualization based on a change in selection in the dropdown menu
    document
      .getElementById("line-stat-selection-impact")
      .addEventListener("change", function () {
        // Call the updateVisualization function when the dropdown value changes
        updateVisualization();
      });

    // Event listener for the dropdown
    document
      .getElementById("event-selection")
      .addEventListener("change", function () {
        updateEventLine(); // This will update the event line
        updateVisualization(); // This will update the rest of the visualization
      });
    // Initial call to update the visualization
    updateVisualization();
    // updateLegend();
  });

  function clicked_candidate(src) {
    // showLoadingIcon();
    let candidate = src.split("/").pop().replace(".png", "");
    candidateStatus[candidate] = !candidateStatus[candidate];
    change_color(candidate, candidateStatus[candidate]);
    updateVisualization();
    // hideLoadingIcon();
  }

  function change_color(candidate, isSelected) {
    let candidateButton = d3.select("#" + candidate + "_button");
    if (isSelected) {
      candidateButton
        .style("background-color", candidateColorMap[candidate.toLowerCase()])
        .classed("blurred-image", false);
    } else {
      candidateButton
        .style("background-color", "#a8a8a8")
        .classed("blurred-image", true);
    }
  }

  // Set initial colors for candidate images on page load
  // Initialize each candidate's status to true (selected) on page load
  selected_candidates.forEach((candidate) => {
    //candidateStatus[candidate] = true; // Set each candidate's status to true
    change_color(candidate, candidateStatus[candidate]); // Update color based on status
  });

  function addEventLine(eventDate, eventName) {
    // Remove existing event line and label if any
    svg.selectAll(".event-line, .event-label").remove();

    // Calculate x-coordinate for the event line
    let eventX = xScale(eventDate);

    // Draw the vertical event line
    svg
      .append("line")
      .attr("class", "event-line")
      .attr("x1", eventX)
      .attr("x2", eventX)
      .attr("y1", 0)
      .transition()
      .duration(2000) // Transition for event line
      .attr("y2", height)
      .style("stroke", "grey")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "4"); // This makes the line dotted

    // Add event label
    svg
      .append("text")
      .attr("class", "event-label")
      .attr("x", eventX)
      .attr("y", 0)
      .style("fill", "grey")
      .attr("text-anchor", "end") // Adjust text-anchor as needed
      .transition()
      .duration(1000) // Transition for label
      .attr("transform", `translate(0, -10)`) // Adjust to position label above the line
      .text(eventName)
      .style("font-size", "12px");
  }

  function updateEventLine() {
    let selectedEvent = document.getElementById("event-selection").value;
    let eventDate = parseDate(selectedEvent);
    let eventName = d3.select("#event-selection option:checked").text();
    console.log("selectedEvent", selectedEvent);
    addEventLine(eventDate, eventName);
  }

  function adjustTextSize() {
    const candidateContainers = document.querySelectorAll(
      ".candidate_containers"
    );

    candidateContainers.forEach((container) => {
      const image = container.querySelector("img");
      const text = container.querySelector(".candidate-name");
      let fontSize = 14; // Start with a reasonable font size

      // Ensure the image is loaded to get its dimensions
      if (image.complete) {
        adjustSize();
      } else {
        image.onload = adjustSize;
      }

      function adjustSize() {
        const maxWidth = image.offsetWidth; // Get the width of the image
        text.style.fontSize = fontSize + "px";

        while (text.offsetWidth > maxWidth && fontSize > 0) {
          fontSize -= 0.5; // Decrease font size
          text.style.fontSize = fontSize + "px";
        }
      }
    });
  }

  // Call adjustTextSize when the page loads and when it's resized
  window.onload = adjustTextSize;
  window.onresize = adjustTextSize;

  function calculateMidpoint(date1, date2) {
    // Calculate the midpoint between two dates
    return new Date((date1.getTime() + date2.getTime()) / 2);
  }

  function updateDynamicTitle() {
    let eventSelect = document.getElementById("event-selection");
    let lineStatSelect = document.getElementById("line-stat-selection-impact");

    // Get the text of the selected option
    let eventSelectionText =
      eventSelect.options[eventSelect.selectedIndex].text;
    let lineStatSelectionText =
      lineStatSelect.options[lineStatSelect.selectedIndex].text;

    // Capitalize the first letter of each candidate's name
    let candidates = Object.keys(candidateStatus)
      .filter((candidate) => candidateStatus[candidate])
      .map(capitalizeFirstLetter)
      .join(", ");

    // let title = `<center>Analyzing <strong>${eventSelectionText}</strong> impact the <strong>${lineStatSelectionText}</strong> for presidential candidates* of interest?<br><i>*${candidates}</i></center>`;
    // document.getElementById("dynamic-chart-title").innerHTML = title;
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  ///TIMELINE SECTION
  let data_timeline = [];
  // set margins, width, height
  let margin_timeline = { top: 0, right: 63, bottom: 50, left: 50 };

  let width_timeline = 900 - margin_timeline.left - margin_timeline.right;
  let height_timeline = 150 - margin_timeline.top - margin_timeline.bottom;
  // Initialize SVG for the new chart
  let timelineSvg = d3
    .select("#timeline-window-area")
    .append("svg")
    .attr(
      "width",
      width_timeline + margin_timeline.left + margin_timeline.right
    )
    .attr(
      "height",
      height_timeline + margin_timeline.top + margin_timeline.bottom
    )
    .append("g")
    .attr(
      "transform",
      "translate(" + margin_timeline.left + "," + margin_timeline.top + ")"
    );

  let timelineXScale = d3.scaleTime().range([0, width_timeline - 25]);
  let timelineYScale = d3.scaleLinear().range([height_timeline, 0]);
  let timelineXAxis = timelineSvg
    .append("g")
    .attr("transform", `translate(0,${height_timeline})`)
    .call(d3.axisBottom(timelineXScale).tickFormat(d3.timeFormat("%m/%d"))); // This line sets the format to month/day
  let timelineYAxis = timelineSvg.append("g");

  // remove existing x axis
  timelineSvg.select(".x-axis").remove();

  // append new x axis
  timelineSvg.append("text")
      .attr("transform", `translate(${width_timeline / 2},${height_timeline + margin_timeline.bottom - 10})`) // Adjust the position as needed
      .style("text-anchor", "middle")
      .text("Date");

  function updateTimelineVisualization(startDate, endDate, column) {
    timelineYAxis.remove();
    // Filter data for candidates that are included in the other chart
    let filteredCandidatesData = filtered_date_data_timeline.filter(
      (d) => candidateStatus[d.last_name.toLowerCase()]
    );
    timelineYScale = d3.scaleLinear().range([height_timeline, 0]);
    timelineYAxis = timelineSvg.append("g");

    // Then group this filtered data
    let groupedData_timeline = d3.group(
      filteredCandidatesData,
      (d) => d.last_name
    );
    // const groupedData_timeline = d3.group(filtered_date_data_timeline, d => d.last_name);
    let column_timeline = column;
    // let globalMinDate = d3.min(filteredCandidatesData, d => d.date);
    // console.log(d3.min(groupedData_timeline.date, d => d.date))
    if (column_timeline === "volume") {
      // Aggregate by week for each candidate
      aggregatedData_timeline = Array.from(
        groupedData_timeline,
        ([key, values]) => {
          let weeklyData_timeline = d3.timeWeek
            .every(1)
            .range(
              d3.min(values, (d) => d.date),
              d3.max(values, (d) => d.date)
            )
            .map((week) => {
              let filtered_timeline = values.filter(
                (d) => d.date >= week && d.date < d3.timeWeek.offset(week, 1)
              );
              //console.log(typeof filtered_timeline)
              // console.log(filtered_timeline.length
              if (filtered_timeline.length === 0) {
                return { date: week, label: 0 };
              } else {
                let count_timeline =
                  d3.count(filtered_timeline, (d) => d.label) / 7;
                return { date: week, label: count_timeline };
              }
            });
          return { candidate: key, values: weeklyData_timeline };
        }
      );
      //console.log(aggregatedData_timeline)
    } else {
      // Aggregate by week for each candidate
      aggregatedData_timeline = Array.from(
        groupedData_timeline,
        ([key, values]) => {
          let weeklyData_timeline = d3.timeWeek
            .every(1)
            .range(
              d3.min(values, (d) => d.date),
              d3.max(values, (d) => d.date)
            )
            .map((week) => {
              let filtered_timeline = values.filter(
                (d) => d.date >= week && d.date < d3.timeWeek.offset(week, 1)
              );
              let average_timeline = d3.mean(filtered_timeline, (d) => d.label);
              return { date: week, label: average_timeline };
            });
          return { candidate: key, values: weeklyData_timeline };
        }
      );
    }

    // Define line generator
    let line_timeline = d3
      .line()
      .x((d) => timelineXScale(d.date))
      .y((d) => timelineYScale(d.label));

    //console.log(aggregatedData_timeline)

    // Draw lines
    timelineSvg
      .selectAll(".line")
      .data(aggregatedData_timeline)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => line_timeline(d.values))
      .attr("data-candidate", (d) => d.candidate)
      .style("stroke", (d, i) => d3.schemeCategory10[i])
      .style("stroke-width", 3)
      .style("fill", "none"); // Ensure that fill is set to none

    // Update scales domain based on aggregatedData
    timelineXScale.domain([
      d3.min(aggregatedData_timeline, (d) => d3.min(d.values, (v) => v.date)),
      d3.max(aggregatedData_timeline, (d) => d3.max(d.values, (v) => v.date)),
    ]);
    timelineYScale.domain([
      0,
      d3.max(aggregatedData_timeline, (d) => d3.max(d.values, (v) => v.label)),
    ]);
    // Transition for x-axis and y-axis
    timelineXAxis
      .transition()
      .duration(500)
      .call(d3.axisBottom(timelineXScale));
    // timelineYScale.ticks(5)
    timelineYAxis
      .transition()
      .duration(500)
      .call(d3.axisLeft(timelineYScale).ticks(3));

    // Select and update circles for data points
    let points_timeline = timelineSvg
      .selectAll(".point-group")
      .data(aggregatedData_timeline);

    // Remove exiting point groups
    points_timeline.exit().remove();

    // Enter new point groups and append circles
    let newPoints_timeline = points_timeline
      .enter()
      .append("g")
      .attr("class", "point-group");

    // Merge existing and new points
    let allPoints_timeline = newPoints_timeline.merge(points_timeline);

    // Update circles for data points
    let circles_timeline = allPoints_timeline
      .selectAll("circle")
      .data((d) => d.values);

    // I DONT WANT TO INCLUDE ANY CIRCLES
    circles_timeline.exit().remove(); // Remove circles that no longer have data
    let lines_timeline = timelineSvg
      .selectAll(".line")
      .data(aggregatedData_timeline);

    // Remove exiting lines
    lines_timeline.exit().remove();

    // Update existing lines with transition
    lines_timeline
      .transition()
      .duration(500)
      .attr("d", (d) => line_timeline(d.values))
      .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()]) // Use color scale for line stroke
      .style("stroke-width", 3) // Adjusting stroke width as needed
      .style("fill", "none"); // Again, ensure that fill is set to none

    // Append new lines with transition
    lines_timeline
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", (d) => line_timeline(d.values))
      .style("stroke", (d) => candidateColorMap[d.candidate.toLowerCase()]) // Use color scale for line stroke
      .style("stroke-width", 3)
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);
    //adding grey boxes to timeline
    // Calculate the x-coordinates for the start and end dates
    let xStart = timelineXScale(startDate);
    let xEnd = timelineXScale(endDate);

    // Update or append left overlay rectangle
    let leftOverlay = timelineSvg.selectAll(".left-overlay").data([0]); // Select left overlay using a class
    leftOverlay
      .enter()
      .append("rect")
      .attr("class", "left-overlay overlay-box")
      .merge(leftOverlay) // Merge enter and update selections
      .attr("x", 0)
      .attr("width", xStart)
      .attr("y", 0)
      .attr("height", height_timeline)
      .style("fill", "rgba(0,0,0,0.5)"); // Grey with 50% transparency

    // Update or append right overlay rectangle
    let rightOverlay = timelineSvg.selectAll(".right-overlay").data([0]); // Select right overlay using a class
    rightOverlay
      .enter()
      .append("rect")
      .attr("class", "right-overlay overlay-box")
      .merge(rightOverlay) // Merge enter and update selections
      .attr("x", xEnd)
      .attr("width", width_timeline - xEnd - 25)
      .attr("y", 0)
      .attr("height", height_timeline)
      .style("fill", "rgba(0,0,0,0.5)"); // black with 50% transparency
  }
}

window.onload = initializeDashboard;
