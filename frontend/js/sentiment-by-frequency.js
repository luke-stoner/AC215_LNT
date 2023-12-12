// parse date
let parseDate = d3.timeParse("%Y%m%d")

d3.csv("data/labeled.csv", row => {
    row.date = parseDate(row.date);
    return row
}).then(rawData => {
    // Define margins
    const sbfMargin = {top: 30, right: 30, bottom: 50, left: 60};

    // Assuming you have predefined the overall width and height of your SVG
    const sbfWidth = 800; // Adjust as needed
    const sbfHeight = 450; // Adjust as needed

    // Effective width and height after accounting for margins
    const sbfEffectiveWidth = sbfWidth - sbfMargin.left - sbfMargin.right;
    const sbfEffectiveHeight = sbfHeight - sbfMargin.top - sbfMargin.bottom;

    // Set up the SVG canvas
    const sbf_svg = d3.select("#sentiment-by-frequency")
        .append("svg")
        .attr("width", sbfWidth)
        .attr("height", sbfHeight)
        .append("g")
        .attr("transform", "translate(" + sbfMargin.left + "," + sbfMargin.top + ")");

    // Set margin, width, height
    let networkMargin = {top: 30, right: 30, bottom: 50, left: 60};
    let networkWidth = 400 - networkMargin.left - networkMargin.right;
    let networkHeight = 450 - networkMargin.top - networkMargin.bottom;

    // initialize svg drawing space
    let network_svg = d3.select("#network-bar-chart-area").append("svg")
        .attr("width", networkWidth + networkMargin.left + networkMargin.right)
        .attr("height", networkHeight + networkMargin.top + networkMargin.bottom)
        .append("g")
        .attr("transform", "translate(" + networkMargin.left + "," + networkMargin.top + ")");

    // Set x,y scales
    let x = d3.scaleLinear().domain([0, 1]).range([0, networkWidth]);
    let y = d3.scaleBand().range([0, networkHeight]).padding(0.1);

    // Initialize slider
    const slider = document.getElementById("sbfSlider")

    // Create variable to store filtered data
    let filtered_date_data = rawData;

    // Set min and maximum dates for slider
    const minDate = d3.min(rawData, (d) => d.date).getTime();
    const maxDate = d3.max(rawData, (d) => d.date).getTime();

    function setupSlider(slider) {
        noUiSlider.create(slider, {
            start: [minDate, maxDate],
            connect: true,
            behaviour: "drag",
            padding: [15, 15],
            step: 1,
            range: {
                min: minDate,
                max: maxDate,
            },
            tooltips: {
                to: (value) => {
                    const date = new Date(parseInt(value));
                    return d3.timeFormat("%b %d, %Y")(date);
                },
            },
        });

        slider.noUiSlider.on("slide", (values) => {
            const selectedMinYear = new Date(+values[0]);
            const selectedMaxYear = new Date(+values[1]);

            filtered_date_data = rawData.filter(
                (d) => d.date >= selectedMinYear && d.date <= selectedMaxYear
            );

            update_sbf_visualization();
            update_network_visualization()
        });
    }

    // Set default value for clicked network to 'all'
    let clickedNetwork = null

    // Add event listener to the button
    const sbfButton = document.getElementById('sbfButton');

    sbfButton.addEventListener('click', function() {
        // Set clickedNetwork value to 'all'
        clickedNetwork = null

        // Update the visualizations
        update_sbf_visualization();
        update_network_visualization();
    });

    // Initialize Slider
    setupSlider(slider);

    // Initialize SBF Visualization
    update_sbf_visualization();

    // Initialize Network Visualization
    update_network_visualization();

    function update_sbf_visualization() {
        // Get selected network
        let network = clickedNetwork

        // Filter data by network
        let filteredData;

        if (network === null) {
            // If 'all' is selected, do not filter the dataset
            filteredData = filtered_date_data;
        } else {
            // Filter the dataset based on the selected network
            filteredData = filtered_date_data.filter(d => d.network === network);
        }

        // Calculate average sentiment label for each candidate
        const sentimentData = d3.rollups(
            filteredData,
            v => d3.mean(v, d => +d.label),
            d => d.first_name + " " + d.last_name
        ).map(d => ({
            name: d[0],
            avg_sentiment: d[1],
            photo: "img/candidate_portraits/" + d[0].split(" ")[1].toLowerCase() + ".png",
            party: filteredData.find(r => (r.first_name + " " + r.last_name) === d[0]).party
        }));
        const candidateOccurrences = d3.rollups(filteredData, v => v.length, d => d.first_name + " " + d.last_name)
            .sort((a, b) => d3.descending(a[1], b[1]));
        //putting them together
        const occurrencesMap = new Map(candidateOccurrences);

        // Add frequency to each sentiment data entry
        const combinedData = sentimentData.map(item => {
            const frequency = occurrencesMap.get(item.name) || 0; // Default to 0 if not found
            return {...item, frequency};
        });

        // Filter data to remove candidates with less than 20 mentions
        const finalData = combinedData.filter(d => d.frequency > 19)

        // Set up scales with padding for x-axis
        const xPadding = 15; // Adjust padding as needed
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(finalData, d => d.frequency)])
            .range([xPadding, sbfEffectiveWidth - xPadding]); // Include padding on both ends

        const yScale = d3.scaleLinear()
            .domain([0, 1]) // Assuming avg_sentiment is between 0 and 1
            .range([sbfEffectiveHeight, 0]);

        // Select the axes if they already exist, and update them
        const xAxis = sbf_svg.selectAll(".x-axis").data([0]); // The data is a dummy placeholder
        const yAxis = sbf_svg.selectAll(".y-axis").data([0]); // The data is a dummy placeholder

        // Create a tooltip
        const tooltip = d3.select("#sentiment-by-frequency")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Remove existing X-axis title before creating a new one
        sbf_svg.selectAll(".x-axis-title").remove();

        // Remove existing Y-axis title before creating a new one
        sbf_svg.selectAll(".y-axis-title").remove();

        // Update the X axis if it exists, else create it
        xAxis.enter()
            .append("g")
            .attr("class", "x-axis")
            .merge(xAxis)
            .transition() // Add a transition
            .duration(750) // 750ms transition
            .attr("transform", `translate(0,${sbfEffectiveHeight})`)
            .call(d3.axisBottom(xScale));

        // Update the Y axis if it exists, else create it
        yAxis.enter()
            .append("g")
            .attr("class", "y-axis")
            .merge(yAxis)
            .transition() // Add a transition
            .duration(750) // 750ms transition
            .call(d3.axisLeft(yScale)
                .tickFormat(d3.format(".0%")));

        // Add Y Axis label
        sbf_svg.append("text")
            .attr("class", "y-axis-title") // Add class to remove existing Y-axis title later
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - sbfMargin.left + 5)
            .attr("x", 0 - (sbfEffectiveHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Positive Mentions"); // Empty text, or you can add a new Y-axis title here

        // Add X Axis label
        sbf_svg.append("text")
            .attr("class", "x-axis-title") // Add class to remove existing X-axis title later
            .attr("transform",
                "translate(" + (sbfEffectiveWidth / 2) + " ," +
                (sbfEffectiveHeight + sbfMargin.bottom - 10) + ")")
            .style("text-anchor", "middle")
            .text("Number of Mentions");

        // Update background circles with transition
        const circles = sbf_svg.selectAll(".backgroundCircles")
            .data(finalData, d => d.name);

        circles.exit()
            .transition()
            .duration(750)
            .attr("r", 0) // Shrink to disappear
            .remove();

        circles.enter()
            .append("circle")
            .attr("class", "backgroundCircles")
            .merge(circles)
            .transition()
            .duration(750)
            .attr("cx", d => xScale(d.frequency))
            .attr("cy", d => yScale(d.avg_sentiment))
            .attr("r", 20) // Adjust the radius as needed
            .attr("fill", d => d.party === "R" ? "#c93235" : "#1475b7")
            .style("stroke", "grey")
            .attr("opacity", 0.7);

        // Update candidate images with transition
        const images = sbf_svg.selectAll(".candidateImages")
            .data(finalData, d => d.name);

        // Remove images that are no longer present in the data
        images.exit()
            .transition()
            .duration(750)
            .attr("width", 0) // Shrink to disappear
            .remove();

        // Add new images and update existing ones
        images.enter()
            .append("image")
            .attr("class", "candidateImages")
            .attr("xlink:href", d => d.photo)
            .attr("x", d => xScale(d.frequency) - 20)
            .attr("y", d => yScale(d.avg_sentiment) - 20)
            .attr("width", 0) // Start with a width of 0 for a transition effect
            .attr("height", 0) // Start with a height of 0 for a transition effect
            .merge(images) // Merge enter and update selections
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<div style="text-align: center; font-weight: bold;">
                                ${d.name}
                                </div>
                                Number of Mentions: ${d.frequency.toLocaleString()}
                                <br/>
                                Positive Mentions: ${d3.format(".0%")(d.avg_sentiment)}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .duration(750)
            .attr("x", d => xScale(d.frequency) - 20)
            .attr("y", d => yScale(d.avg_sentiment) - 20)
            .attr("width", 40) // Set the final width
            .attr("height", 40) // Set the final height
            .attr("clip-path", "circle()");
    }

    function update_network_visualization() {
        // Networks to include in the filtered dataset
        const networksToInclude = ['FOXNEWSW', 'MSNBCW', 'CNNW', 'CSPAN', 'BBCNEWS', 'FBC'];

        // Filter the dataset to include only specified networks
        const filteredData = filtered_date_data.filter(entry => networksToInclude.includes(entry.network));

        // Get sentiment data for networks
        let data = d3
            .rollups(
                filteredData,
                (v) => d3.mean(v, (d) => +d.label),
                (d) => d.network
            )
            .map((d) => ({
                network: d[0],
                avg_sentiment: d[1],
                photo:
                    "img/networks/" + d[0] + ".png",
            }))
            .sort((a, b) => d3.descending(a.avg_sentiment, b.avg_sentiment));

        // Function to map network values to colors
        function assignColor(network) {
            switch(network) {
                case 'CSPAN':
                    return '#001A72';
                case 'FOXNEWSW':
                    return '#003366';
                case 'CNNW':
                    return '#cc0000';
                case 'BBCNEWS':
                    return '#b90005';
                case 'MSNBCW':
                    return '#6460AA';
                case 'FBC':
                    return '#000000';
            }
        }

        // Add 'color' variable to the JSON data
        data.forEach(entry => {
            entry.color = assignColor(entry.network);
        });

        // Set transition duration
        const TRANSITION_DURATION = 750; // Transition duration in milliseconds

        // Clear existing chart elements
        network_svg.selectAll("*").remove();

        // Re-create X axis
        network_svg
            .append("g")
            .attr("transform", `translate(0,${networkHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format(".0%")));

        // Add X axis title
        network_svg.append("text")
            .attr("class", "x-axis-title") // Add class to remove existing X-axis title later
            .attr("transform",
                "translate(" + (networkWidth / 2) + " ," +
                (networkHeight+ networkMargin.bottom - 10) + ")")
            .style("text-anchor", "middle")
            .text("Positive Mentions");

        // Update Y axis domain based on new data
        y.domain(data.map((d) => d.network));
        network_svg
            .append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll(".tick text")
            .attr("x", -y.bandwidth() * 1.2)
            .style("text-anchor", "end")
            .style("font-size", "16px");

        // Add bars with transition
        const bars = network_svg
            .selectAll("bars")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", x(0) - y.bandwidth() / 2)
            .attr("y", (d) => y(d.network))
            .attr("height", y.bandwidth())
            .attr("fill", (d) => d.color)
            .attr('opacity', (d) => {
                if (!clickedNetwork || clickedNetwork === d.network) {
                    return 1;
                } else {
                    return 0.5;
                }
            });

        bars
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("width", (d) => x(d.avg_sentiment) + y.bandwidth() / 2);

        // Add background circles with transition
        const backgroundCircles = network_svg
            .selectAll("backgroundCircles")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", x(0) - y.bandwidth() / 2)
            .attr("cy", (d) => y(d.network) + y.bandwidth() / 2)
            .attr("r", 0)
            .attr("fill", "white")
            .attr("stroke", (d) => d.color)
            .attr("stroke-width", 3)
            .attr('stroke-opacity', (d) => {
                if (!clickedNetwork || clickedNetwork === d.network) {
                    return 1;
                } else {
                    return 0.5;
                }
            });

        backgroundCircles
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("r", y.bandwidth() / 2);

        // Add images with transition
        const images = network_svg
            .selectAll("networkImages")
            .data(data)
            .enter()
            .append("image")
            .attr("xlink:href", (d) => d.photo)
            .attr("x", x(0) - y.bandwidth())
            .attr("y", (d) => y(d.network))
            .attr("height", 0)
            .attr("width", 0)
            .attr("clip-path", "circle()")
            .attr('opacity', (d) => {
                if (!clickedNetwork || clickedNetwork === d.network) {
                    return 1;
                } else {
                    return 0.5;
                }
            });

        images
            .transition()
            .duration(TRANSITION_DURATION)
            .attr("height", y.bandwidth())
            .attr("width", y.bandwidth());

        // Add click event handling for bars and images
        bars.on('mouseover', function() {
            // Change pointer to cursor on hover
            d3.select(this).classed('cursor-mouseover', true);
        });

        images.on('mouseover', function() {
            // Change pointer to cursor on hover
            d3.select(this).classed('cursor-mouseover', true);
        });

        // Add click event handling for bars and images
        bars.on('click', function(event, d) {
            clickedNetwork = (clickedNetwork === d.network) ? null : d.network;

            // Update the visualizations
            update_sbf_visualization();
            update_network_visualization();
        });

        images.on('click', function(event, d) {
            clickedNetwork = (clickedNetwork === d.network) ? null : d.network;

            // Update the visualizations
            update_sbf_visualization();
            update_network_visualization();
        });
    }
});