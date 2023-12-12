import define from "./index.js";
import { Runtime, Inspector } from "./runtime.js";

function whiteHouseVisualization() {
  const runtime = new Runtime();
  const main = runtime.module(
    define,
    Inspector.into(document.getElementById("special-viz"))
  );

  // Get all elements with the class "observablehq"
  const elements = document.querySelectorAll(".observablehq");

  // Check if there are more than one element with the class
  if (elements.length > 1) {
    // Loop through elements starting from the second one (index 1)
    for (let i = 1; i < elements.length; i++) {
      // Remove each element except the first one
      elements[i].remove();
    }
  }
}

whiteHouseVisualization();
