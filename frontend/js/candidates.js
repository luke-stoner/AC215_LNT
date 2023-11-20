const candidate_descriptions = [
  {
    first: "Joe",
    last: "Biden",
    party: "Democrat",
    party_short: "D",
    image: "img/candidate_portraits/biden.png",
    state: "Delaware",
    birthday: "November 20, 1942",
  },
  {
    first: "Doug",
    last: "Burgum",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/burgum.png",
    state: "North Dakota",
    birthday: "August 1, 1956",
  },
  {
    first: "Chris",
    last: "Christie",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/christie.png",
    state: "New Jersey",
    birthday: "September 6, 1962",
  },
  {
    first: "Ron",
    last: "DeSantis",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/desantis.png",
    state: "Florida",
    birthday: "September 14, 1978",
  },
  {
    first: "Larry",
    last: "Elder",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/elder.png",
    state: "California",
    birthday: "April 27, 1952",
  },
  {
    first: "Asa",
    last: "Hutchinson",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/hutchinson.png",
    state: "Arkansas",
    birthday: "December 3, 1950",
  },
  {
    first: "Nikki",
    last: "Haley",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/haley.png",
    state: "South Carolina",
    birthday: "January 20, 1972",
  },
  {
    first: "Will",
    last: "Hurd",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/hurd.png",
    state: "Texas",
    birthday: "August 19, 1977",
  },
  {
    first: "Perry",
    last: "Johnson",
    image: "img/candidate_portraits/johnson.png",
    party: "Republican",
    party_short: "R",
    state: "Michigan",
    birthday: "January 23, 1948",
  },
  {
    first: "Robert",
    last: "Kennedy Jr",
    party: "Independent",
    party_short: "I",
    image: "img/candidate_portraits/kennedy-jr.png",
    birthday: "January 17, 1954",
    state: "Washington, D.C",
  },
  {
    first: "Mike",
    last: "Pence",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/pence.png",
    birthday: "June 7, 1959",
    state: "Indiana",
  },
  {
    first: "Vivek",
    last: "Ramaswamy",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/ramaswamy.png",
    birthday: "August 9, 1985",
    state: "Ohio",
  },
  {
    first: "Tim",
    last: "Scott",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/scott.png",
    birthday: " September 19, 1965",
    state: "South Carolina",
  },
  {
    first: "Donald",
    last: "Trump",
    party: "Republican",
    party_short: "R",
    image: "img/candidate_portraits/trump.png",
    birthday: "June 14, 1946",
    state: "Florida",
  },
  {
    first: "Marianne",
    last: "Williamson",
    party: "Democrat",
    party_short: "D",
    image: "img/candidate_portraits/williamson.png",
    birthday: "July 8, 1952",
    state: "Iowa",
  },
];

const party_color = {
  Republican: "#B31942",
  Democrat: "#0A3161",
  Independent: "gray",
};

// Create SVG
const width = 900;
const height = 600;
const margin = 20;
const circleRadius = 65;
const circlePadding = 30;
const columns = Math.floor(
  (width - 2 * margin) / (2 * circleRadius + circlePadding)
);
const rows = Math.ceil(candidate_descriptions.length / columns);
const colWidth = (width - 2 * margin) / columns;
const rowHeight = (height - 2 * margin) / rows;

const svg = d3
  .select("#candidate-info")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "candidate-svg");

// Shadows for circles
const filter = svg
  .append("defs")
  .append("filter")
  .attr("id", "drop-shadow")
  .attr("height", "130%");

filter
  .append("feGaussianBlur")
  .attr("in", "SourceAlpha")
  .attr("stdDeviation", 5)
  .attr("result", "blur");

filter
  .append("feOffset")
  .attr("in", "blur")
  .attr("dx", 3)
  .attr("dy", 3)
  .attr("result", "offsetBlur");

const feMerge = filter.append("feMerge");
feMerge.append("feMergeNode").attr("in", "offsetBlur");
feMerge.append("feMergeNode").attr("in", "SourceGraphic");

// Create a tooltip div
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 50)
  .style("position", "absolute")
  .style("background-color", "rgba(255, 255, 255, 0.8)") // Slightly transparent white
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px");

// Candidate Circles
const circles = svg
  .selectAll("g")
  .data(candidate_descriptions)
  .enter()
  .append("g")
  .on("mouseover", function (event, d) {
    handleCircleMouseOver(event, d, this);
  })
  .on("mousemove", function (event) {
    // Update tooltip position while moving the mouse
    tooltip
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY + 10 + "px");
  })
  .on("mouseout", function () {
    handleCircleMouseOut(this);
  });

circles
  .append("circle")
  .attr("class", "candidate-circle")
  .attr("cx", (d, i) => (i % columns) * colWidth + margin + circleRadius)
  .attr(
    "cy",
    (d, i) => Math.floor(i / columns) * rowHeight + margin + circleRadius
  )
  .attr("r", circleRadius)
  .attr("fill", (d) => party_color[d.party])
  .attr("filter", "url(#drop-shadow)");

circles
  .append("text")
  .text((d) => `${d.last}`)
  .attr("x", (d, i) => (i % columns) * colWidth + margin + circleRadius)
  .attr(
    "y",
    (d, i) => Math.floor(i / columns) * rowHeight + margin + circleRadius + 4
  )
  .attr("text-anchor", "middle")
  .attr("alignment-baseline", "middle")
  .attr("class", "candidate-label")
  .attr("fill", "white")
  .style("user-select", "none");

const legendWidth = Object.keys(party_color).length * 120;
const legendX = (width - legendWidth) / 2;

const legend = svg
  .append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${legendX}, ${height - margin})`);

const legendItems = legend
  .selectAll(".legend-item")
  .data(Object.keys(party_color))
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (d, i) => `translate(${i * 120}, -10)`);

legendItems
  .append("circle")
  .attr("r", 7)
  .attr("cx", 10)
  .attr("cy", 10)
  .attr("fill", (d) => party_color[d]);

legendItems
  .append("text")
  .text((d) => d)
  .attr("x", 20)
  .attr("y", 12)
  .attr("alignment-baseline", "middle");

function handleCircleMouseOver(event, candidate, element) {
  d3.select(element)
    .select(".candidate-circle")
    .transition()
    .duration(200)
    .attr("r", circleRadius + 5);
  d3.select(element).select(".candidate-label").classed("hovered-text", true);

  // Show the tooltip
  tooltip.transition().duration(200).style("opacity", 1);

  // Populate the tooltip content
  tooltip
    .html(
      `<strong>${candidate.first} ${candidate.last}</strong><br>Party: ${
        candidate.party
      }<br>State: ${candidate.state}<br>Age: ${calculateAge(
        candidate.birthday
      )}`
    )
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY + 10 + "px");

  // Show candidate photo and name
  const photoDiv = document.getElementById("candidate-info-photo");
  photoDiv.innerHTML = `<img src="${candidate.image}" alt="${candidate.first} ${candidate.last}" style="width: 100%;" class="img-fluid hover-animate delay-0 rounded-circle">`;

  const nameDiv = document.getElementById("candidate-info-name");
  const nameElement = document.createElement("h5");
  nameElement.textContent = `${candidate.first} ${candidate.last}`;
  nameDiv.innerHTML = "";
  nameDiv.appendChild(nameElement);
}

function handleCircleMouseOut(element) {
  d3.select(element)
    .select(".candidate-circle")
    .transition()
    .duration(200)
    .attr("r", circleRadius);
  d3.select(element).select(".candidate-label").classed("hovered-text", false);

  // Hide the tooltip
  tooltip.transition().duration(200).style("opacity", 0);
}

function calculateAge(birthday) {
  var birthdayDate = new Date(birthday);
  var today = new Date();

  var age = today.getFullYear() - birthdayDate.getFullYear();
  var monthDifference = today.getMonth() - birthdayDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthdayDate.getDate())
  ) {
    age--;
  }

  return age;
}
