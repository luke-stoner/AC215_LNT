class NetworkCoverage {
  static FONT_SIZE = "2em"; // Increase the font size
  static NETWORKS = ["FOXNEWSW", "CSPAN", "MSNBCW", "CNNW"]; // Fixed networks list

  constructor(selector, dataPath) {
    this.selector = selector;
    this.dataPath = dataPath;
    this.gridSize = 200; // Decreased grid size
    this.margin = { top: 20, right: 20, bottom: 20, left: 20 };
    this.svg = null;
    this.defs = null; // For gradient definitions
    this.allData = null;
  }

  // Load data from the given path
  loadData() {
    d3.csv(this.dataPath)
      .then((data) => {
        this.allData = data;
        this.updateVisualization();
      })
      .catch((error) => console.error("Error loading data:", error));
  }

  // Update the visualization for specified networks
  updateVisualization() {
    this.clearVisualization();
    let filteredData = this.filterDataByNetworks(NetworkCoverage.NETWORKS);
    let networkPercentages = this.calculatePercentages(filteredData);
    this.setupSVG(networkPercentages.length);
    this.createGrid(networkPercentages);
  }

  // Clear existing SVG content
  clearVisualization() {
    d3.select(this.selector).select("svg").remove();
  }

  // Filter data for specific networks
  filterDataByNetworks(networks) {
    return this.allData.filter((d) => networks.includes(d.network));
  }

  // Filter data by party
  filterDataByParty(data) {
    return data.filter((d) => d.party === "R" || d.party === "D");
  }

  // Calculate percentages for each network
  calculatePercentages(data) {
    let filteredData = this.filterDataByParty(data);
    let networkData = d3.group(filteredData, (d) => d.network);
    return Array.from(networkData, ([network, rows]) => ({
      network,
      democrat_coverage: d3.mean(rows, (d) => (d.party === "D" ? 1 : 0)) * 100,
      republican_coverage:
        d3.mean(rows, (d) => (d.party === "R" ? 1 : 0)) * 100,
    }));
  }

  // Setup SVG element adjusted for 2x2 grid
  setupSVG() {
    const numRows = 2;
    const numCols = 2;
    const width =
      this.gridSize * numCols + this.margin.left + this.margin.right;
    const height =
      this.gridSize * numRows + this.margin.top + this.margin.bottom;

    this.svg = d3
      .select(this.selector)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Definitions for gradients
    this.defs = this.svg.append("defs");

    // Main group for visualization
    this.svg = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  // Create gradient for each network
  createGradient(id, democratPercentage, republicanPercentage) {
    let gradient = this.defs.append("linearGradient").attr("id", id);

    gradient
      .append("stop")
      .attr("offset", `${democratPercentage}%`)
      .attr("stop-color", DEMOCRAT_BLUE);

    gradient
      .append("stop")
      .attr("offset", `${republicanPercentage}%`)
      .attr("stop-color", REPUBLICAN_RED); // REPUBLICAN_RED
  }

  // Create grid cells with gradient-filled text for 2x2 layout
  createGrid(networkPercentages) {
    networkPercentages.forEach((networkData, i) => {
      let col = i % 2; // Column: 0 or 1
      let row = Math.floor(i / 2); // Row: 0 or 1

      // Create gradient for each network
      let gradientId = `gradient-${networkData.network}`;
      this.createGradient(
        gradientId,
        networkData.democrat_coverage,
        networkData.republican_coverage
      );

      let cell = this.svg
        .append("g")
        .attr("class", "cell")
        .attr(
          "transform",
          `translate(${col * this.gridSize}, ${row * this.gridSize})`
        );

      cell
        .append("text")
        .attr("x", this.gridSize / 2)
        .attr("y", this.gridSize / 2) // Centered vertically within the cell
        .attr("text-anchor", "middle")
        .style("font-size", NetworkCoverage.FONT_SIZE)
        .style("font-weight", "bold") // Set font-weight to bold
        .attr("fill", `url(#${gradientId})`)
        .text(networkData.network);
    });
  }
}

// Usage of the class
const networkCoverage = new NetworkCoverage(
  "#network-coverage",
  "data/labeled.csv"
);
networkCoverage.loadData(); // This will now load and display the specified networks in a 2x2 grid
