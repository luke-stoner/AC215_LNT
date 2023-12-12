const CANDIDATE_COLORS = {
  "perry johnson":
    "<span style='color: blue; font-weight: bold;'>Perry Johnson</span>",

  "doug burgum":
    "<span style='color: #964B00; font-weight: bold;'>Doug Burgum</span>",
  burgum: "<span style='color: #964B00; font-weight: bold;'>Burgum</span>",

  "larry elder":
    "<span style='color: #FFA500; font-weight: bold;'> Elder</span>",
  elder: "<span style='color: #FFA500; font-weight: bold;'>Elder</span>",

  vivek: "<span style='color: #008080; font-weight: bold;'>Vivek</span>",
  ramaswamy:
    "<span style='color: #008080; font-weight: bold;'>Ramaswamy</span>",

  nikki: "<span style='color: #FFA500; font-weight: bold;'>Nikki</span>",
  haley: "<span style='color: #FFA500; font-weight: bold;'>Haley</span>",

  marianne: "<span style='color: #800080; font-weight: bold;'>Marianne</span>",
  "marianne williamson":
    "<span style='color: #800080; font-weight: bold;'>Marianne Williamson</span>",

  "tim scott":
    "<span style='color: #008000; font-weight: bold;'>Tim Scott</span>",
  scott: "<span style='color: #008000; font-weight: bold;'>Scott</span>",

  "ron desantis":
    "<span style='color: #2ca02c; font-weight: bold;'>Ron DeSantis</span>",
  desantis: "<span style='color: #2ca02c; font-weight: bold;'>Desantis</span>",

  "mike pence": "<span style='color: #00FF00; font-weight: bold;'>Mike</span>",
  pence: "<span style='color: #00FF00; font-weight: bold;'>Pence</span>",

  robert: "<span style='color: #A52A2A; font-weight: bold;'>Robert</span>",
  kennedy: "<span style='color: #A52A2A; font-weight: bold;'>Kennedy</span>",

  joe: "<span style='color: #1f77b4; font-weight: bold;'>Joe</span>",
  biden: "<span style='color: #1f77b4; font-weight: bold;'>Biden</span>",

  "will hurd":
    "<span style='color: #A52A2A; font-weight: bold;'>Will Hurd</span>",
  hurd: "<span style='color: #A52A2A; font-weight: bold;'>Hurd</span>",

  "chris christie":
    "<span style='color: #800080; font-weight: bold;'>Chris Christie</span>",
  christie: "<span style='color: #800080; font-weight: bold;'>Christie</span>",

  "asa hutchinson":
    "<span style='color: #FFA500; font-weight: bold;'>Asa Hutchinson</span>",
  hutchinson:
    "<span style='color: #FFA500; font-weight: bold;'>Hutchinson</span>",

  donald: "<span style='color: #f00808; font-weight: bold;'>Donald</span>",
  trump: "<span style='color: #f00808; font-weight: bold;'>Trump</span>",
};

let width = 624;
let height = 352;

function _n(width, height) {
  const n = Math.round((width * height) / 80);
  return n;
}
async function loadCSV() {
  const data = await d3.csv("data/labeled.csv");
  return data;
}

function _height(data) {
  return data.height;
}

function replaceCandidateNamesWithSpans(text) {
  const regex = new RegExp(
    "\\b(" + Object.keys(CANDIDATE_COLORS).join("|") + ")\\b",
    "gi"
  );
  return text.replace(regex, (match) => {
    return CANDIDATE_COLORS[match.toLowerCase()] || match;
  });
}

function formatDate(inputDate) {
  const year = inputDate.slice(0, 4);
  const month = inputDate.slice(4, 6);
  const day = inputDate.slice(6, 8);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

function _2(DOM, width, height, script, invalidation, data, n) {
  const context = DOM.context2d(width, height);
  const worker = new Worker(script);

  function messaged({ data: points }) {
    const pointData = [];
    const canvas = context.canvas;

    // Create tooltip element (only once)
    let tooltip = d3
      .select(".observablehq")
      .append("div")
      .attr("class", "tv-tooltip")
      .style("opacity", 0)
      .attr("z-index", 1000);

    for (let i = 0, n = points.length / 2; i < n; i++) {
      const x = points[i * 2],
        y = points[i * 2 + 1];
      context.moveTo(x + 1.5, y);
      context.arc(x, y, 1.5, 0, 2 * Math.PI);

      // Associate each point with data from mappedData
      if (i < mappedData.length) {
        pointData.push({
          x,
          y,
          text: mappedData[i].text,
          network: mappedData[i].network,
          date: mappedData[i].date,
        });
      }
    }
    context.fillStyle = "#000000";
    context.fill();

    // Attach mousemove event listener to the canvas
    d3.select(canvas).on("mousemove", function (event) {
      // Get mouse coordinates
      const [mouseX, mouseY] = d3.pointer(event);

      // Check if mouse is over any point
      let isOverPoint = false;
      for (const point of pointData) {
        const dx = mouseX - point.x;
        const dy = mouseY - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 25) {
          isOverPoint = true;
          // Replace candidate names in point.text
          const updatedText = replaceCandidateNamesWithSpans(point.text);
          const formattedDate = formatDate(point.date);

          const tooltipHTML = `
          <div>
            <strong>Date:</strong> ${formattedDate}<br>
            <strong>Network:</strong> ${point.network}<br><br>
            ${updatedText}
          </div>
        `;

          tooltip
            .html(tooltipHTML)
            .style("opacity", 1)
            .style("top", mouseY + 20 + "px")
            .style("left", mouseX + 10 + "px");
        }
      }

      if (!isOverPoint) {
        tooltip.style("opacity", 0);
      }

      // Attach mouseout event listener to the canvas
      d3.select(canvas).on("mouseout", function () {
        if (tooltip) {
          tooltip.style("opacity", 0);
        }
      });
    });
  }

  invalidation.then(() => worker.terminate());
  worker.addEventListener("message", messaged);
  worker.postMessage({ data, width, height, n });
  return context.canvas;
}

async function _script(require, invalidation) {
  const blob = new Blob(
    [
      `
importScripts("${await require.resolve("d3-delaunay@^5.1.1")}");

onmessage = event => {
  const {data: {data, width, height, n}} = event;
  const points = new Float64Array(n * 2);
  const c = new Float64Array(n * 2);
  const s = new Float64Array(n);

  // Initialize the points using rejection sampling.
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < 30; ++j) {
      const x = points[i * 2] = Math.floor(Math.random() * width);
      const y = points[i * 2 + 1] = Math.floor(Math.random() * height);
      if (Math.random() < data[y * width + x]) break;
    }
  }

  const delaunay = new d3.Delaunay(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  for (let k = 0; k < 80; ++k) {

    // Compute the weighted centroid for each Voronoi cell.
    c.fill(0);
    s.fill(0);
    for (let y = 0, i = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const w = data[y * width + x];
        i = delaunay.find(x + 0.5, y + 0.5, i);
        s[i] += w;
        c[i * 2] += w * (x + 0.5);
        c[i * 2 + 1] += w * (y + 0.5);
      }
    }

    // Relax the diagram by moving points to the weighted centroid.
    // Wiggle the points a little bit so they don’t get stuck.
    const w = Math.pow(k + 1, -0.8) * 10;
    for (let i = 0; i < n; ++i) {
      const x0 = points[i * 2], y0 = points[i * 2 + 1];
      const x1 = s[i] ? c[i * 2] / s[i] : x0, y1 = s[i] ? c[i * 2 + 1] / s[i] : y0;
      points[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * w;
      points[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * w;
    }

    postMessage(points);
    voronoi.update();
  }

  close();
};
`,
    ],
    { type: "text/javascript" }
  );
  const script = URL.createObjectURL(blob);
  invalidation.then(() => URL.revokeObjectURL(script));
  return script;
}

function _data(FileAttachment, width, DOM) {
  return FileAttachment("image1 (1).jpg")
    .image()
    .then((image) => {
      const height = Math.round((width * image.height) / image.width);
      const context = DOM.context2d(width, height, 1);
      context.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        width,
        height
      );
      const { data: rgba } = context.getImageData(0, 0, width, height);
      const data = new Float64Array(width * height);
      for (let i = 0, n = rgba.length / 4; i < n; ++i)
        data[i] = Math.max(0, 1 - rgba[i * 4] / 254);
      data.width = width;
      data.height = height;
      return data;
    });
}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() {
    return this.url;
  }
  const fileAttachments = new Map([
    [
      "image1 (1).jpg",
      {
        url: new URL("/img/white-house.png", import.meta.url),
        mimeType: "image/jpeg",
        toString,
      },
    ],
  ]);
  main.builtin(
    "FileAttachment",
    runtime.fileAttachments((name) => fileAttachments.get(name))
  );
  main
    .variable(observer())
    .define(
      ["DOM", "width", "height", "script", "invalidation", "data", "n"],
      _2
    );
  main
    .variable(observer("script"))
    .define("script", ["require", "invalidation"], _script);
  main
    .variable(observer("data"))
    .define("data", ["FileAttachment", "width", "DOM"], _data);
  main.variable(observer("n")).define("n", ["width", "height"], _n);
  main.variable(observer("height")).define("height", ["data"], _height);
  return main;
}

const n = _n(width, height);
const csvData = await loadCSV();
const mappedData = csvData.slice(-n);
