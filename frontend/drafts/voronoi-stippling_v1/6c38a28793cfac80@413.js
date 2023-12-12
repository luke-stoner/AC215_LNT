// https://observablehq.com/@codedragon491/voronoi-stippling/3@413
let width = 1001;
let height = 565;

// Then call _n function with the width and height
const n = _n(width, height);

// Now call loadCSV and use 'n'
const csvData = await loadCSV();
const mappedData = csvData.slice(-n);

function _1(md){return(
md`# Voronoi Stippling

This notebook applies a weighted variant of [Lloyd’s algorithm](/@mbostock/lloyds-algorithm) to implement stippling. Points are initially positioned randomly using rejection sampling, then at each iteration, the Voronoi cell centroids are weighted by the lightness of the contained pixels.

This technique is based on [*Weighted Voronoi Stippling*](https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf) by [Adrian Secord](https://cs.nyu.edu/~ajsecord/stipples.html); see also posts by [Muhammad Firmansyah Kasim](https://mfkasim91.github.io/2016/12/06/stippling-pictures-with-lloyds-algorithm/), [Egor Larionov](https://elrnv.com/blog/weighted-lloyds-method-for-voronoi-tesselation/) and [Noah Veltman](https://bl.ocks.org/veltman/017a2093623e1bf3ae041dd3380578cb).`
)}

function _2(DOM,width,height,script,invalidation,data,n)
{
  const context = DOM.context2d(width, height);
  const worker = new Worker(script);

  // function messaged({data: points}) {
  //   context.fillStyle = "#fff";
  //   context.fillRect(0, 0, width, height);
  //   context.beginPath();
  //   for (let i = 0, n = points.length; i < n; i += 2) {
  //     const x = points[i], y = points[i + 1];
  //     context.moveTo(x + 1.5, y);
  //     context.arc(x, y, 1.5, 0, 2 * Math.PI);
  //   }
  //   context.fillStyle = "#000";
  //   context.fill();
  // }
  function messaged({data: points}) {
    // Existing drawing code...
    const tooltip = document.getElementById('tooltip');
    const pointData = [];
    const canvas = context.canvas;
    for (let i = 0, n = points.length / 2; i < n; i++) {
      const x = points[i * 2], y = points[i * 2 + 1];
      context.moveTo(x + 1.5, y);
      context.arc(x, y, 1.5, 0, 2 * Math.PI);

      // Associate each point with data from mappedData
      if (i < mappedData.length) {
        pointData.push({ x, y, text: mappedData[i].text });
      }
    }
    context.fillStyle = "#000";
    context.fill();

    // Add mousemove listener to canvas
    canvas.addEventListener('mousemove', function(event) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Find if mouse is close to any point
      const radius = 5; // radius to detect mouse hover
      const hoveredPoint = pointData.find(p =>
          Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2) < radius
      );

      if (hoveredPoint) {
        tooltip.style.display = 'block';
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top = event.clientY + 'px';
        tooltip.textContent = hoveredPoint.text;
      } else {
        tooltip.style.display = 'none';
      }
    });
  }


  invalidation.then(() => worker.terminate());
  worker.addEventListener("message", messaged);
  worker.postMessage({data, width, height, n});
  return context.canvas;
}


async function _script(require,invalidation)
{
  const blob = new Blob([`
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
`], {type: "text/javascript"});
  const script = URL.createObjectURL(blob);
  invalidation.then(() => URL.revokeObjectURL(script));
  return script;
}


function _data(FileAttachment,width,DOM){return(
FileAttachment("image1 (1).jpg").image().then(image => {
  const height = Math.round(width * image.height / image.width);
  console.log("height:", height)
  console.log("width:", width)
  const context = DOM.context2d(width, height, 1);
  context.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
  const {data: rgba} = context.getImageData(0, 0, width, height);
  const data = new Float64Array(width * height);
  for (let i = 0, n = rgba.length / 4; i < n; ++i) data[i] = Math.max(0, 1 - rgba[i * 4] / 254);
  data.width = width;
  data.height = height;
  return data;
})
)}

function _n(width, height) {
  const n = Math.round(width * height / 80);
  console.log("Number of points (n):", n);
  return n;
}

// Then call _n function with the width and height you have
//const n = _n(width, height); // Ensure 'width' and 'height' are defined before this line
//
// // Now call loadCSV and use 'n'
// const csvData = await loadCSV();
// const mappedData = csvData.slice(0, n);

async function loadCSV() {
  const data = await d3.csv("data/labeled.csv");
  return data;
}

function _height(data){return(
data.height
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  // const fileAttachments = new Map([
  //   ["image1 (1).jpg", {url: new URL("./files/12cfa53c5463f9ebbfcb2ac1aa2ab4ee44d076679b7a687c9e27b0ae4c920d68d5185f06e693bc0c2b7ac5e23d7964119c15be586865a1682b2b44cde3a753b0.jpeg", import.meta.url), mimeType: "image/jpeg", toString}]
  // ]);
  const fileAttachments = new Map([
    ["image1 (1).jpg", {url: new URL("./files/white-house.png", import.meta.url), mimeType: "image/jpeg", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["DOM","width","height","script","invalidation","data","n"], _2);
  main.variable(observer("script")).define("script", ["require","invalidation"], _script);
  main.variable(observer("data")).define("data", ["FileAttachment","width","DOM"], _data);
  main.variable(observer("n")).define("n", ["width","height"], _n);
  main.variable(observer("height")).define("height", ["data"], _height);
  return main;
}


