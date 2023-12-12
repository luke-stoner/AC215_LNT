class SentimentChart {
  constructor() {
    if (SentimentChart.instance) {
      return SentimentChart.instance;
    }
    SentimentChart.instance = this;

    this.setupProperties();
    this.initChart();
    this.bindEvents();
    this.overallAverageSentiment = null;
    this.initialLoad();
  }
  initialLoad() {
    d3.csv(this.dataUrl).then((rawData) => {
      this.overallAverageSentiment =
        this.calculateOverallAverageSentiment(rawData);
      this.updateDescription("option1");
      let processedData = SentimentChart.filterData(rawData, true);
      this.updateChart(processedData);
    });
  }

  setupProperties() {
    this.margin = { top: 30, right: 30, bottom: 30, left: 230 };
    this.width = 800 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.selector = "#candidate-sentiment-bars";
    this.dataUrl = "data/labeled.csv";
    this.transitionDuration = 750;
  }

  initChart() {
    this.x = d3.scaleLinear().domain([0, 1]).range([0, this.width]);
    this.y = d3.scaleBand().range([0, this.height]).padding(0.1);

    this.svg = d3
      .select(this.selector)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  bindEvents() {
    const self = this;
    d3.selectAll('input[name="inlineRadioOptions"]').on("change", function () {
      const selectedValue = d3.select(this).property("value");
      self.updateDescription(selectedValue);

      const showAll = d3.select("#show-all-sentiment").property("checked");
      self.loadData(self.dataUrl, (rawData) =>
        SentimentChart.filterData(rawData, showAll)
      );
    });
  }

  updateDescription(selectedValue) {
    let descriptionHTML = "";

    switch (selectedValue) {
      case "option2":
        descriptionHTML = `
        <p>Here are the candidates currently leading in recent <a href="https://www.realclearpolitics.com/epolls/latest_polls/2024/" target="_blank">election polls</a>.
         It's important to note that while they are in the lead, many of these candidates receive less positive mentions on average compared to all candidates,
          which currently stands at  <strong><span style="color: green;">${(
            100 * this.overallAverageSentiment
          ).toFixed(0)}%</span></strong>. </p>
        <p>This could indicate that positive coverage in the media is not necessary to gain votes,
        and that the number of mentions is perhaps more important for candidates seeking to win the presidency.</p>`;
        break;
      case "option1":
        descriptionHTML = `
        <p>This visualization shows the percentage of positive reports for each of the candidates. 
        Interestingly, it reveals that some of the lesser-known or lesser-mentioned candidates 
        actually have a higher percentage of positive media mentions compared to their overall media presence.
        <p>
        This may indicate that networks prefer to focus negative coverage on candidates with higher
        name recognition.</p>`;
        break;
      default:
        descriptionHTML = "!";
    }

    d3.select("#candidate-sentiment-description").html(descriptionHTML);
  }

  calculateOverallAverageSentiment(rawData) {
    const sentimentPerCandidate = d3
      .rollups(
        rawData,
        (v) => d3.mean(v, (d) => +d.label),
        (d) => d.first_name + " " + d.last_name
      )
      .map((d) => d[1]);

    return d3.mean(sentimentPerCandidate);
  }

  updateChart(data) {
    this.clearChart();
    this.createAxis(data);
    this.createBars(data);
    this.createBarExtensions(data);
    this.createBackgroundCircles(data);
    this.createImages(data);
    this.createDashedLine();
    this.createLegend();
  }

  clearChart() {
    this.svg.selectAll("*").remove();
  }

  createAxis(data) {
    this.svg
      .append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(
        d3
          .axisBottom(this.x)
          .tickValues([0, 0.25, 0.5, 0.75, 1])
          .tickFormat(d3.format(".0%"))
      );

    this.svg
      .append("text")
      .attr("class", "x-axis-title")
      .attr("x", this.width / 2)
      .attr("y", this.height + 30)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("% Positive Mentions");

    this.y.domain(data.map((d) => d.name));
    this.svg
      .append("g")
      .call(d3.axisLeft(this.y).tickSize(0))
      .selectAll(".tick text")
      .attr("x", -this.y.bandwidth() * 1.2)
      .style("text-anchor", "end")
      .style("font-size", "16px");
  }

  createBars(data) {
    const bars = this.svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", this.x(0))
      .attr("y", (d) => this.y(d.name))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => PARTY_COLOR_MAP[d.party])
      .on("mouseover", function (event, d) {
        // Tooltip
        const tooltip = d3
          .select("#candidate-sentiment-bars")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        tooltip
          .style("opacity", 1)
          .html(
            `<div style="text-align: center; font-weight: bold;">
                ${d.name}
              </div>
              Positive Mentions: ${d3.format(".1%")(d.avg_sentiment)}`
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

    bars
      .transition()
      .duration(this.transitionDuration)
      .attr("width", (d) => this.x(d.avg_sentiment));
  }

  createBarExtensions(data) {
    const barExtensions = this.svg
      .selectAll("barExtensions")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", this.x(0) - this.y.bandwidth() / 2)
      .attr("y", (d) => this.y(d.name))
      .attr("height", this.y.bandwidth())
      .attr("fill", (d) => PARTY_COLOR_MAP[d.party]);

    barExtensions
      .transition()
      .duration(this.transitionDuration)
      .attr("width", this.y.bandwidth());
  }

  createBackgroundCircles(data) {
    const backgroundCircles = this.svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", this.x(0) - this.y.bandwidth() / 2)
      .attr("cy", (d) => this.y(d.name) + this.y.bandwidth() / 2)
      .attr("r", 0)
      .attr("fill", "white")
      .attr("stroke", (d) => PARTY_COLOR_MAP[d.party])
      .attr("stroke-width", 3);

    backgroundCircles
      .transition()
      .duration(this.transitionDuration)
      .attr("r", this.y.bandwidth() / 2);
  }

  createImages(data) {
    const images = this.svg
      .selectAll("image")
      .data(data)
      .enter()
      .append("image")
      .attr("xlink:href", (d) => d.photo)
      .attr("x", this.x(0) - this.y.bandwidth())
      .attr("y", (d) => this.y(d.name))
      .attr("height", 0)
      .attr("width", 0)
      .attr("clip-path", "circle()");

    images
      .transition()
      .duration(this.transitionDuration)
      .attr("height", this.y.bandwidth())
      .attr("width", this.y.bandwidth());
  }

  createDashedLine() {
    this.svg
      .append("line")
      .attr("x1", this.x(0.5))
      .attr("x2", this.x(0.5))
      .attr("y1", 0)
      .attr("y2", this.height)
      .style("stroke-dasharray", "5,5")
      .style("stroke", "#000000")
      .style("stroke-width", 2);
  }

  createLegend() {
    const legend = this.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.width - 150}, ${this.height - 50})`);

    // 50% Line
    legend
      .append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 21)
      .attr("y2", 21)
      .style("stroke", "#000000")
      .style("stroke-width", 2)
      .style("stroke-dasharray", "5,5");

    legend
      .append("text")
      .attr("x", 33)
      .attr("y", 25)
      .text("50% Line")
      .style("font-size", "12px");
  }

  loadData(dataUrl, filterFunction) {
    d3.csv(dataUrl).then((rawData) => {
      let processedData = filterFunction(rawData);
      this.updateChart(processedData);
    });
  }

  static filterData(rawData, showAll) {
    const sentimentData = d3
      .rollups(
        rawData,
        (v) => d3.mean(v, (d) => +d.label),
        (d) => d.first_name + " " + d.last_name
      )
      .map((d) => ({
        name: d[0],
        avg_sentiment: d[1],
        photo:
          "img/candidate_portraits/" +
          d[0].split(" ")[1].toLowerCase() +
          ".png",
        party: rawData.find((r) => r.first_name + " " + r.last_name === d[0])
          .party,
      }))
      .sort((a, b) => d3.descending(a.avg_sentiment, b.avg_sentiment));

    const candidateOccurrences = d3
      .rollups(
        rawData,
        (v) => v.length,
        (d) => d.first_name + " " + d.last_name
      )
      .sort((a, b) => d3.descending(a[1], b[1]));

    if (showAll) {
      return sentimentData;
    } else {
      const topCandidates = [
        "Joe Biden",
        "Donald Trump",
        "Ron DeSantis",
        "Nikki Haley",
        "Vivek Ramaswamy",
      ];
      return sentimentData.filter((d) => topCandidates.includes(d.name));
    }
  }
}
