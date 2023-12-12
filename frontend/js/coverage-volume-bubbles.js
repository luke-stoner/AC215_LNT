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
        name: v[0].first_name + " " + v[0].last_name,
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
    const width = 950;
    const height = 650;
    const margin = 30;
    const strokeWidth = 7 / 60;
    const initialX = width / 2;
    const initialY = 0;
    const numCircles = data.length;

    // Create SVG container
    this.svg = d3
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
    const group = this.svg.append("g");

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
      .style(
        "stroke-width",
        (d) => `${radiusScale(d.frequency) * strokeWidth}px`
      )
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
      .attr(
        "width",
        (d) =>
          2 * radiusScale(d.frequency) - radiusScale(d.frequency) * strokeWidth
      )
      .attr(
        "height",
        (d) =>
          2 * radiusScale(d.frequency) - radiusScale(d.frequency) * strokeWidth
      )
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
          cumulativeWidths[i] -
          radiusScale(d.frequency) +
          (radiusScale(d.frequency) * strokeWidth) / 2
      )
      .attr(
        "y",
        (d) =>
          height / 2 -
          radiusScale(d.frequency) +
          (radiusScale(d.frequency) * strokeWidth) / 2
      )
      .style("opacity", 0);

    // Additional text to show after all transitions are complete
    const totalDelay = numCircles * fanOutDelay;
    const firstMessage = this.svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 3)
      .text("There is a lot of variance here...")
      .attr("text-anchor", "middle")
      .style("opacity", 0);

    const obj = this;

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
        const secondMessage = this.svg
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
                        .duration(2000)
                        .delay((d, i) => i * 50)
                        .attr("x", (d, i) => cumulativeWidths[i])
                        .style("fill", (d) => PARTY_COLOR_MAP[d.party])
                        .attr(
                          "y",
                          (d) =>
                            height / 2 -
                            radiusScale(d.frequency) -
                            radiusScale(d.frequency) * strokeWidth -
                            10
                        )
                        .style("opacity", 1)
                        .end() // End of the current transition
                        .then(() => {
                          // Pause for a specified time before starting the next transition
                          const pauseDuration = 1000; // Pause for 1000 milliseconds (1 second)

                          setTimeout(() => {
                            // Begin fading and translating all elements after the pause
                            const transitionDuration = 2000;

                            // Transition for labels
                            labels
                              .transition()
                              .duration(transitionDuration)
                              .style("opacity", 0) // Fade out labels
                              .attr("x", width / 2) // Move to the middle of the screen horizontally
                              .attr("y", height / 2); // Move to the middle of the screen vertically

                            // Transition for images
                            images
                              .transition()
                              .duration(transitionDuration)
                              .style("opacity", 0) // Fade out images
                              .attr(
                                "x",
                                (d) => width / 2 - radiusScale(d.frequency)
                              ) // Center horizontally
                              .attr(
                                "y",
                                (d) => height / 2 - radiusScale(d.frequency)
                              ); // Center vertically

                            // Transition for circles
                            circles
                              .transition()
                              .duration(transitionDuration)
                              .style("opacity", 0) // Fade out circles
                              .attr("cx", width / 2) // Move to the middle of the screen horizontally
                              .attr("cy", height / 2)
                              .end()
                              .then(() => {
                                // End of the first set of animations
                                obj.svg.selectAll("*").remove();
                                obj.secondVisualization(data);
                              });
                          }, pauseDuration);
                        });
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

  secondVisualization(data) {
    // Sort data
    data.sort((a, b) => b.frequency - a.frequency);

    // Get the width and height from the existing SVG
    const width = +this.svg.attr("width");
    const height = +this.svg.attr("height");
    const strokeWidth = 7 / 60;

    const pack = d3.pack().size([width, height]).padding(2);

    // Define a scale for the circle sizes
    const maxFrequency = d3.max(data, (d) => d.frequency);
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxFrequency])
      .range([10, 100]); // Adjust range as needed

    const root = d3
      .hierarchy({ children: data })
      .sum((d) => radiusScale(d.frequency));

    // Create node groups, initially positioned at the center
    const node = this.svg
      .selectAll(".node")
      .data(pack(root).leaves())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", `translate(${width / 2},${height / 2})`); // Start at center

    // Create clipPaths for images with initial small radius
    node
      .append("clipPath")
      .attr("id", (d, i) => "clip-" + i)
      .append("circle")
      .attr("r", 10); // Start with small radius

    // Append circles to nodes with initial small radius
    const circles = node
      .append("circle")
      .attr("r", 10) // Start with small radius
      .style("fill", (d) => LIGHT_PARTY_COLOR_MAP[d.data.party])
      .style("opacity", 0);

    // Append images to nodes
    const images = node
      .append("svg:image")
      .attr("xlink:href", (d) => d.data.photo)
      .attr("clip-path", (d, i) => "url(#clip-" + i + ")")
      .attr("x", (d) => -radiusScale(d.data.frequency))
      .attr("y", (d) => -radiusScale(d.data.frequency))
      .attr("height", (d) => 2 * radiusScale(d.data.frequency))
      .attr("width", (d) => 2 * radiusScale(d.data.frequency))
      .style("opacity", 0)
      .on("mouseover", function (event, d) {
        // Tooltip
        const tooltip = d3
          .select("#volume-bubbles")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        tooltip
          .style("opacity", 1)
          .html(
            `<div style="text-align: center; font-weight: bold;">
              ${d.data.name}
            </div>
            Number of Mentions: ${d.data.frequency.toLocaleString()}`
          )
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY - 28}px`);

        this.__tooltip = tooltip;
      })
      .on("mouseout", function (event, d) {
        if (this.__tooltip) {
          this.__tooltip
            .transition()
            .duration(200) // Set duration for the transition
            .style("opacity", 0)
            .remove()
            .on("end", () => {
              this.__tooltip = null;
            });
        }
      });

    // Transition nodes to their final positions with staggered delay
    node
      .transition()
      .duration(1000) // Duration of the transition in milliseconds
      .delay((d, i) => i * 100) // Stagger the start of each transition
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Transition for circles and clipPaths to scale up
    circles
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("r", (d) => radiusScale(d.data.frequency))
      .style("stroke", (d) => PARTY_COLOR_MAP[d.data.party])
      .style(
        "stroke-width",
        (d) => `${radiusScale(d.data.frequency) * strokeWidth}px`
      )
      .style("opacity", 1);

    node
      .selectAll("clipPath circle")
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr(
        "r",
        (d) =>
          radiusScale(d.data.frequency) -
          (radiusScale(d.data.frequency) * strokeWidth) / 2
      );

    // Transition for images to scale up and fade in
    images
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("x", (d) => -radiusScale(d.data.frequency))
      .attr("y", (d) => -radiusScale(d.data.frequency))
      .attr("height", (d) => 2 * radiusScale(d.data.frequency))
      .attr("width", (d) => 2 * radiusScale(d.data.frequency))
      .style("opacity", 1);
  }
}
