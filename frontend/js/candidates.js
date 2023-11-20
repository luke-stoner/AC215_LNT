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

// Dimensions and layout parameters
const width = 900;
const height = 600;
const margin = 20;
const circleRadius = 65;
const circlePadding = 30;
const columns = Math.floor(
  (width - 2 * margin) / (2 * circleRadius + circlePadding)
); // Calculate the number of columns dynamically
const rows = Math.ceil(candidate_descriptions.length / columns); // Calculate the number of rows based on the number of columns
const colWidth = (width - 2 * margin) / columns; // Calculate the width of each column based on the number of columns
const rowHeight = (height - 2 * margin) / rows; // Calculate the height of each row based on the number of rows

// Create SVG element inside the div#candidate-info
const svg = d3
  .select("#candidate-info")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "candidate-svg");

// Define the shadow filter
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

// Create and position circles
const circles = svg
  .selectAll("g")
  .data(candidate_descriptions)
  .enter()
  .append("g")
  .on("mouseover", function (event, d) {
    d3.select(this)
      .select(".candidate-circle")
      .transition()
      .duration(200)
      .attr("r", circleRadius + 5);
    d3.select(this).select(".candidate-label").classed("hovered-text", true);
    handleCircleMouseOver(event, d);
  })
  .on("mouseout", function () {
    d3.select(this)
      .select(".candidate-circle")
      .transition()
      .duration(200)
      .attr("r", circleRadius);
    d3.select(this).select(".candidate-label").classed("hovered-text", false);
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
  .attr("fill", "white");

function handleCircleMouseOver(event, candidate) {
  // Candidate Image
  const photoDiv = document.getElementById("candidate-info-photo");
  photoDiv.innerHTML = `<img src="${candidate.image}" alt="${candidate.first} ${candidate.last}" style="width: 100%;" class="img-fluid hover-animate delay-0 rounded-circle">`;

  // Candidate Name
  const nameDiv = document.getElementById("candidate-info-name");
  const nameElement = document.createElement("h5");
  nameElement.textContent = `${candidate.first} ${candidate.last}`;
  nameDiv.innerHTML = "";
  nameDiv.appendChild(nameElement);

  // Candidate party
  const partyDiv = document.getElementById("candidate-info-party");
  const partyElement = document.createElement("h5");
  partyElement.textContent = `Party: ${candidate.party}`;
  partyDiv.innerHTML = "";
  partyDiv.appendChild(partyElement);

  // Candidate state
  const stateDiv = document.getElementById("candidate-info-state");
  const stateElement = document.createElement("h5");
  stateElement.textContent = `State: ${candidate.state}`;
  stateDiv.innerHTML = "";
  stateDiv.appendChild(stateElement);

  // Candidate birthday
  const birthdayDiv = document.getElementById("candidate-info-birthday");
  const birthdayElement = document.createElement("h5");
  birthdayElement.textContent = `Birthday: ${candidate.birthday}`;
  birthdayDiv.innerHTML = "";
  birthdayDiv.appendChild(birthdayElement);
}
