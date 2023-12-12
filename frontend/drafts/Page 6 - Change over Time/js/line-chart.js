// set margins, width, height
let margin = {top: 40, right: 40, bottom: 60, left: 60};

let width = 900 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// initialize svg drawing space
let svg = d3.select("#line-chart-area").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// format date
let formatDate = d3.timeFormat("%Y%m%d")

// parse date
let parseDate = d3.timeParse("%Y%m%d")

// Initialize data
let data = []; // Initialize empty array

// Load CSV file
d3.csv("data/labeled.csv", row => {
	row.date = parseDate(row.date);
	return row
}).then(csv => {

	// Store csv data in global variable
	data = csv;

	// define scales for data
	let x = d3.scaleTime()
		.range([0, width]);

	let y = d3.scaleLinear()
		.range([height, 0]);

	// Define x and y scales and axes outside the updateVisualization function
	const xScale = d3.scaleTime().range([0, width]);
	const yScale = d3.scaleLinear().range([height, 0]);

	const xAxis = svg.append('g').attr('transform', `translate(0,${height})`);
	const yAxis = svg.append('g');

	// Define a color scale
	const colorScale = d3.scaleOrdinal(d3.schemeCategory10)

	// Create date slider
	const sliderRange = d3
		.sliderBottom()
		.min(d3.min(data, d => d.date))
		.max(d3.max(data, d => d.date))
		.width(250)
		.tickFormat(d3.timeFormat('%Y-%m-%d'))
		.ticks(3)
		.default([d3.min(data, d => d.date), d3.max(data, d => d.date)])
		.fill('#85bb65');

	// Add the slider to the DOM
	const gRange = d3
		.select('#slider-range')
		.append('svg')
		.attr('width', 400)
		.attr('height', 100)
		.append('g')
		.attr('transform', 'translate(90,30)');

	gRange.call(sliderRange);

	// set date data to full range by default
	let filtered_date_data = data

	// call update visualization function
	updateVisualization()

	// Update the visualization based on a change in selection in the dropdown menu
	document.getElementById('line-stat-selection').addEventListener('change', function () {
		// Call the updateVisualization function when the dropdown value changes
		updateVisualization();
	});

	// get selected years from slider and filter data
	sliderRange.on('onchange', val => {
		// Filter data based on slider values
		filtered_date_data = data.filter(d => d.date >= val[0] && d.date <= val[1])
		updateVisualization();
	});

	// Listen for changes in checkboxes and update graph accordingly
	document.querySelectorAll('#checkboxes input[type="checkbox"]').forEach(checkbox => {
		checkbox.addEventListener('change', updateVisualization);
	});

	function updateVisualization() {
		// create list of selected candidates
		const selectedCandidates = []; // Array to store selected candidates
		// Get all checkbox elements
		const checkboxes = document.querySelectorAll('#checkboxes input[type="checkbox"]');
		// Iterate through checkboxes to find selected candidates
		checkboxes.forEach(checkbox => {
			if (checkbox.checked) {
				selectedCandidates.push(checkbox.id); // Add checked candidate to the array
			}
		});

		// filter data to only include selected candidates
		let filteredData = filtered_date_data.filter(candidate => {
			return selectedCandidates.includes(candidate.last_name);
		});

		// Get the selected attribute from the dropdown
		let column = document.getElementById("line-stat-selection").value;

		// Group data by candidate
		const groupedData = d3.group(filteredData, d => d.last_name)

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

		// Draw lines
		svg.selectAll('.line')
			.data(aggregatedData)
			.enter().append('path')
			.attr('class', 'line')
			.attr('d', d => line(d.values))
			.style('stroke', (d, i) => d3.schemeCategory10[i]);

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
			.style('stroke', (d) => colorScale(d.candidate)); // Use color scale for line stroke

		// Append new lines with transition
		lines.enter().append('path')
			.attr('class', 'line')
			.attr('d', d => line(d.values))
			.style('stroke', (d) => colorScale(d.candidate)) // Use color scale for line stroke
			.style('opacity', 0)
			.transition().duration(500)
			.style('opacity', 1);
	}
})
