/**
 * Represents a Bubble Chart visualization.
 * This is the class we use for our volume visualization.
 * The inspiration comes from Youtube videos that compare the size of
 * objects in our solar system.
 */
class BubbleChart {
  /**
   * Creates an instance of BubbleChart.
   * If an instance already exists, it returns that instance. (Singleton)
   */
  constructor() {
    if (BubbleChart.instance) {
      return BubbleChart.instance;
    }
    BubbleChart.instance = this;

    this.loadData();
  }
  /**
   * Loads data from a CSV file and initializes the visualization.
   * @async
   */
  async loadData() {
    const csvData = await d3.csv("data/labeled.csv");
    const data = d3.rollup(
      csvData,
      (v) => ({
        name: v[0].last_name,
        frequency: v.length,
        photo: `img/candidate_portraits/${v[0].last_name.toLowerCase()}.png`,
        party: v[0].party,
      }),
      (d) => `${d.first_name}_${d.last_name}`
    );

    this.createVisualization(Array.from(data.values()));
  }

  /**
   * Creates the Bubble Chart visualization.
   * @param {Array} data - The data for the visualization.
   */
  createVisualization(data) {
    const width = 900;
    const height = 600;
    const margin = 30;
    const strokeWidth = 7 / 60;
    const initialX = width / 2;
    const initialY = 0;
    const numCircles = data.length;

    // Create SVG container
    const svg = d3
      .select("#volume-bubbles")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Sort data so that smallest circles are on left
    data.sort((a, b) => a.frequency - b.frequency);

    // Define a scale for the circle radius based on frequency
    const maxFrequency = d3.max(data, (d) => d.frequency);
    const radiusScale = d3.scaleSqrt().domain([0, maxFrequency]).range([6, 50]);
    const fontSizeScale = d3.scaleLinear().domain([4, 50]).range([5, 24]);

    // Calculate cumulative widths for circles
    // This helps space circles evenly accounting for variation in size
    let cumulativeWidths = [margin];
    data.forEach((d, i) => {
      if (i > 0) {
        const previousCircle = data[i - 1];
        const spacing =
          radiusScale(d.frequency) + radiusScale(previousCircle.frequency) + 10;
        cumulativeWidths.push(cumulativeWidths[i - 1] + spacing);
      }
    });

    // Create circles with radius based on frequency
    const group = svg.append("g");

    const circles = group
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", initialX)
      .attr("cy", initialY)
      .attr("r", (d) => radiusScale(d.frequency))
      .style("fill", (d) => LIGHT_PARTY_COLOR_MAP[d.party])
      .style("stroke", (d) => PARTY_COLOR_MAP[d.party])
      .style("stroke-width", (d) => `${(radiusScale(d.frequency) * strokeWidth)}px`)
      .style("opacity", 0);

    // Add frequency label at the center of each circle
    const labels = group
      .selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", (d, i) => cumulativeWidths[i])
      .attr("y", (d) => height / 2)
      .text((d) => d.frequency.toLocaleString())
      .attr("text-anchor", "middle")
      .style("fill", (d) => "#FFFFFF")
      .style("font-size", (d) => `${fontSizeScale(radiusScale(d.frequency))}px`)
      .attr("dy", (d) => `${fontSizeScale(radiusScale(d.frequency)) / 2 - 2}px`)
      .style("opacity", 0);

    // Transition for circles to fan out into a straight line
    const fanOutDuration = 300;
    const fanOutDelay = fanOutDuration / 2;
    circles
      .transition()
      .duration(fanOutDuration)
      .delay((d, i) => i * fanOutDelay)
      .attr("cx", (d, i) => cumulativeWidths[i])
      .attr("cy", height / 2)
      .style("opacity", 1);

    // Transition for labels to match circle position
    labels
      .transition()
      .duration(fanOutDuration)
      .delay((d, i) => i * fanOutDelay + 200)
      .attr("x", (d, i) => cumulativeWidths[i])
      .attr("y", (d) => height / 2)
      .style("opacity", 1);

    // Append image elements for each data point
    // We hide for now, but will reveal later
    const images = group
      .selectAll("image")
      .data(data)
      .enter()
      .append("image")
      .attr("xlink:href", (d) => d.photo)
      .attr("x", (d) => initialX - radiusScale(d.frequency))
      .attr("y", (d) => initialY - radiusScale(d.frequency))
      .attr("width", (d) => 2 * radiusScale(d.frequency) - (radiusScale(d.frequency) * strokeWidth))
      .attr("height", (d) => 2 * radiusScale(d.frequency) - (radiusScale(d.frequency) * strokeWidth))
      .style("opacity", 0)
      .style("clip-path", "circle(50%)");

    // Transition for images to fan out with circles
    // Remain hidden but make sure they are in correct position
    images
      .transition()
      .duration(fanOutDuration)
      .delay((d, i) => i * fanOutDelay)
      .attr(
        "x",
        (d, i) =>
          cumulativeWidths[i] - radiusScale(d.frequency) + (radiusScale(d.frequency) * strokeWidth) / 2
      )
      .attr("y", (d) => height / 2 - radiusScale(d.frequency) + (radiusScale(d.frequency) * strokeWidth) / 2)
      .style("opacity", 0);

    // Additional text to show after all transitions are complete
    const totalDelay = numCircles * fanOutDelay;
    const firstMessage = svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("There is a lot of variance here...")
      .attr("text-anchor", "middle")
      .style("opacity", 0);

    firstMessage
      .transition()
      .delay(totalDelay)
      .duration(1000)
      .style("opacity", 1)
      .transition()
      .delay(1000)
      .duration(1000)
      .style("opacity", 0)
      .end() // End first message
      .then(() => {
        // Begin second message
        const secondMessage = svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height / 3)
          .text("Some candidates are mentioned more than others...")
          .attr("text-anchor", "middle")
          .style("opacity", 0)
          .transition()
          .duration(1000)
          .style("opacity", 1)
          .transition()
          .delay(1000)
          .duration(1000)
          .style("opacity", 0)
          .end() // End of second message
          .then(() => {
            // Function to focus on each circle
            function focusOnCircle(index) {
              if (index >= data.length) {
                // If it's the last circle, reset the view after a delay
                setTimeout(() => {
                  group
                    .transition()
                    .duration(300)
                    .attr("transform", "translate(0,0) scale(1)")
                    .on("end", () => {
                      labels // Show frequency labels after the zoom and pan animation
                        .transition()
                        .duration(200)
                        .delay((d, i) => i * 50)
                        .attr("x", (d, i) => cumulativeWidths[i])
                        .style("fill", (d) => PARTY_COLOR_MAP[d.party])
                        .attr(
                          "y",
                          (d) =>
                            height / 2 -
                            radiusScale(d.frequency) -
                            (radiusScale(d.frequency) * strokeWidth) -
                            10
                        )
                        .style("opacity", 1);
                    });
                }, 100);
                return;
              }

              const xPosition = cumulativeWidths[index];
              const scale = 5;
              const translateX = width / 2 - xPosition * scale;
              const translateY = height / 2 - (height / 2) * scale;

              // Zoom to the circle first
              group
                .transition()
                .duration(500)
                .attr(
                  "transform",
                  `translate(${translateX}, ${translateY}) scale(${scale})`
                )
                .on("end", () => {
                  // After zooming, fade out the label
                  labels
                    .filter((d, i) => i === index)
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
                    .on("end", () => {
                      // After label fades out, fade in the image
                      images
                        .filter((d, i) => i === index)
                        .transition()
                        .duration(200)
                        .style("opacity", 1)
                        .on("end", () => {
                          setTimeout(() => {
                            focusOnCircle(index + 1);
                          }, 50); // Delay before moving to the next circle
                        });
                    });
                });
            }

            // Start the sequential transition with the first circle
            focusOnCircle(0);
          });
      });
  }
}
