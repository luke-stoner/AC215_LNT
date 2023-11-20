// Function to parse CSV data
function parseData(data) {
    const countMap = new Map();
    data.forEach(row => {
        const candidateKey = row.first_name + "_" + row.last_name;
        if (countMap.has(candidateKey)) {
            countMap.set(candidateKey, countMap.get(candidateKey) + 1);
        } else {
            countMap.set(candidateKey, 1);
        }
    });

    return Array.from(countMap, ([key, frequency]) => {
        const [firstName, lastName] = key.split("_");
        return {
            name: lastName,
            frequency: frequency,
            photo: "img/candidate_portraits/" + lastName.toLowerCase() + ".png",
            party: data.find(d => d.first_name === firstName && d.last_name === lastName).party
        };
    });
}

// Load the CSV data
d3.csv("data/labeled.csv").then(function(csvData) {
    var data = parseData(csvData);
    // Define the size of the SVG and margins
    var width = 960,
        height = 500,
        margin = {top: 20, right: 20, bottom: 20, left: 20};

    // Compute the inner dimensions
    var innerWidth = width - margin.left - margin.right,
        innerHeight = height - margin.top - margin.bottom;

    // Append the SVG object to the volume-bubbles div
    var svg = d3.select("#volume-bubbles").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Create a pack layout with the new dimensions
    var pack = d3.pack()
        .size([innerWidth, innerHeight])
        .padding(2);

    // // Process the data to create a hierarchy
    // var root = d3.hierarchy({children: data})
    //     .sum(function(d) { return d.frequency; }) // Size of the bubbles
    //     .sort(function(a, b) { return b.value - a.value; }); // Sort bubbles by size
    //
    // // Create the nodes and link data
    // // Create the nodes and link data
    // var node = svg.selectAll(".node")
    //     .data(pack(root).leaves())
    //     .enter().append("g")
    //     .attr("class", "node")
    //     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    // Process the data to create a hierarchy and sort
    var root = d3.hierarchy({children: data})
        .sum(function(d) { return d.frequency; }); // Size of the bubbles

    // Create the pack layout and nodes
    var node = svg.selectAll(".node")
        .data(pack(root).leaves())
        .enter().append("g")
        .attr("class", "node");
    // Define the clipPath
    node.append("clipPath")
        .attr("id", function(d, i) { return "clip-" + i; }) // Give a unique id for each clipPath
        .append("circle")
        .attr("r", function(d) { return d.r; });
    // Define the transition
    var t = d3.transition()
        .duration(750);

    // Apply the transition to the nodes
    node.transition(t)
        .delay(function(d, i) { return i * 50; }) // Delay by index
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    // Define a scale for your legend sizes
    var sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, function(d) { return d.frequency; })])
        .range([0, 50]); // Change 50 to the maximum size you want in the legend

    // Define the sizes you want to show in the legend
    var legendSizes = [10, 50, 100]; // Example sizes

    // Create the legend group
    var legend = svg.append("g")
        .attr("class", "legend")
        .selectAll("g")
        .data(legendSizes)
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + (innerWidth - 150) + "," + (i * 60 + 20) + ")"; });

    // Append circles to the legend group
    legend.append("circle")
        .attr("r", function(d) { return sizeScale(d); })
        .style("fill", "#ccc")
        .style("opacity", 0.5);

    // Append text to the legend group
    legend.append("text")
        .attr("x", function(d) { return sizeScale(d) + 10; })
        .attr("y", 5)
        .text(function(d) { return "Frequency: " + d; });

    // Transition for circles
    // Sort data to ensure that smaller circles are on top
    data.sort(function(a, b) { return b.frequency - a.frequency; });

    // Define the transition
    var t = d3.transition()
        .duration(750);

    // Draw the circles with a delay based on the order
    // node.data(pack(root).leaves())
    //     .transition(t)
    //     .delay(function(d, i) { return i * 50; }) // Delay by index
    //     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    // Append circle for each node and set the fill based on party
    node.append("circle")
        .attr("r", function(d) { return d.r; })
        .style("fill", function(d) {
            return d.data.party === "D" ? "#1475b7" : "#c93235";
        });

    // Append images to each node, using the clipPath
    node.append("svg:image")
        .attr("xlink:href", function(d) { return d.data.photo; })
        .attr("clip-path", function(d, i) { return "url(#clip-" + i + ")"; }) // Reference the unique clipPath id
        .attr("x", function(d) { return -d.r; })
        .attr("y", function(d) { return -d.r; })
        .attr("height", function(d) { return 2 * d.r; })
        .attr("width", function(d) { return 2 * d.r; });

    // ... (any additional features or labels)
}).catch(function(error) {
    console.error('Error loading the data:', error);
});