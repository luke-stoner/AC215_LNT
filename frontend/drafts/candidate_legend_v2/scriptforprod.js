// class DataManager {
//     constructor() {
//         this.data = [];
//         this.parseDate = d3.timeParse("%Y%m%d");
//         this.loadData();
//     }
//
//     loadData() {
//         d3.csv("data/labelednew.csv", row => {
//             row.date = this.parseDate(row.date);
//             return row;
//         }).then(csv => {
//             this.data = csv;
//         });
//     }
//
//     filterData(startDate, endDate) {
//         return this.data.filter(d => d.date >= startDate && d.date <= endDate);
//     }
// }
//
//
//
//
// class Chart {
//     constructor(dataManager) {
//         this.dataManager = dataManager;
//         this.margin = {top: 40, right: 60, bottom: 40, left: 60};
//         this.width = parseFloat(d3.select('#timelinerow').style('width')) - this.margin.left - this.margin.right;
//         this.height = 400 - this.margin.top - this.margin.bottom;
//         this.svg = null;
//         this.xScale = null;
//         this.yScale = null;
//         this.xAxis = null;
//         this.yAxis = null;
//         this.candidateStatus = {
//             "biden": true, "christie": true, "desantis": true, "haley": true,
//             "kennedy": true, "pence": true, "ramaswamy": true, "scott": true,
//             "trump": true, "williamson": true
//         };
//         this.candidateColorMap = {};
//         selected_candidates.forEach((candidate, index) => {
//             this.candidateColorMap[candidate.toLowerCase()] = d3.schemeCategory10[index];
//         });
//         this.selected_candidates = ["biden", "christie", "desantis", "haley", "kennedy", "pence", "ramaswamy", "scott", "trump", "williamson"];
//         this.initializeChart();
//     }
//
//     initializeChart() {
//         this.svg = d3.select("#impact-event-chart-area").append("svg")
//             .attr("width", this.width + this.margin.left + this.margin.right)
//             .attr("height", this.height + this.margin.top + this.margin.bottom)
//             .append("g")
//             .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
//
//         // Initialize scales and axes
//         this.xScale = d3.scaleTime().range([0, this.width - 50]);
//         this.yScale = d3.scaleLinear().range([this.height, 0]);
//         this.xAxis = this.svg.append('g').attr('transform', `translate(0,${this.height})`);
//         this.yAxis = this.svg.append('g');
//
//         // Additional initialization code if needed
//     }
//
//
//     updateVisualization() {
//         this.svg.selectAll('.line-group').remove();
//         this.svg.selectAll('.line-extension').remove();
//         this.svg.selectAll('.line-extension-label').remove();
//
//         let selectedEvent = document.getElementById("event-selection").value || '20230801';
//         let eventDate = this.dataManager.parseDate(selectedEvent);
//         let startDate = d3.timeDay.offset(eventDate, -14);
//         let endDate = d3.timeDay.offset(eventDate, 15);
//         let labelEndDate = d3.timeDay.offset(eventDate, 14);
//         let midpoint1 = this.calculateMidpoint(startDate, eventDate);
//         let midpoint2 = this.calculateMidpoint(eventDate, labelEndDate);
//         let eventName = d3.select('#event-selection option:checked').text();
//
//         let filtered_date_data = this.dataManager.data.filter(d => d.date >= startDate && d.date <= endDate);
//         let filteredData = filtered_date_data.filter(d => this.candidateStatus[d.last_name.toLowerCase()]);
//         const groupedData = d3.group(filteredData, d => d.last_name);
//
//         let column = document.getElementById("line-stat-selection-impact").value;
//
//         let aggregatedData = Array.from(groupedData, ([key, values]) => {
//             const dailyData = d3.timeDay.range(
//                 startDate,
//                 d3.timeDay.offset(endDate, 1)
//             ).map(day => {
//                 const filtered = values.filter(d => d.date.getTime() === day.getTime());
//                 let metric;
//                 if (column === 'volume') {
//                     metric = d3.count(filtered, d => d.label);
//                 } else {
//                     metric = d3.mean(filtered, d => d.label);
//                 }
//                 return {date: day, label: metric};
//             });
//             return {candidate: key, values: dailyData};
//         });
//
//         this.xScale.domain([startDate, endDate]);
//         this.yScale.domain([0, d3.max(aggregatedData, d => d3.max(d.values, v => v.label))]);
//
//         this.updateEventLine(eventDate, eventName);
//         let tickValues = [startDate, midpoint1, eventDate, midpoint2, labelEndDate];
//
//         this.xAxis.transition().duration(500).call(d3.axisBottom(this.xScale)
//             .tickValues(tickValues)
//             .tickFormat(d => {
//                 let formatMonth = d.getMonth() + 1;
//                 let formatDay = d.getDate();
//                 return `${formatMonth}/${formatDay}`;
//             }));
//
//         this.yAxis.transition().duration(500).call(d3.axisLeft(this.yScale));
//
//         const lineGroups = this.svg.selectAll('.line-group')
//             .data(aggregatedData)
//             .enter().append('g')
//             .attr('class', 'line-group');
//
//         lineGroups.append('path')
//             .attr('class', 'line')
//             .attr('d', d => this.customLine(d.values))
//             .style('stroke', d => this.candidateColorMap[d.candidate.toLowerCase()])
//             .style('fill', 'none')
//             .style('stroke-width', 2);
//
//         lineGroups.each(function (d) {
//             d3.select(this).selectAll('circle')
//                 .data(d.values.filter(v => v.label != null))
//                 .enter().append('circle')
//                 .attr('class', 'datapoint')
//                 .attr('cx', d => this.xScale(d.date))
//                 .attr('cy', d => this.yScale(d.label))
//                 .attr('r', 3)
//                 .attr('data-candidate', d.candidate)
//                 .style('fill', this.candidateColorMap[d.candidate.toLowerCase()])
//                 .style('stroke', this.candidateColorMap[d.candidate.toLowerCase()])
//                 .style('stroke-width', 1);
//         }.bind(this)); // Binding this context
//
//         // Event handlers, tooltip, and other logic go here
//         // ... (rest of your event handlers and other logic)
//         // Event Handlers for mouseover and mouseout
//         lineGroups.selectAll('.line, .datapoint')
//             .on('mouseover', (event, d) => {
//                 console.log("Hovering over:", d.candidate); // Debugging line
//                 this.highlightLine(d.candidate);
//                 this.bringToFront(d.candidate);
//             })
//             .on('mouseout', () => {
//                 this.restoreLines();
//             });
//
// // Tooltip Div Selection
//         let tooltip = d3.select('.tooltip');
//
//         lineGroups.selectAll('.datapoint')
//             .on('mouseover', (event, d) => {
//                 var candidateName = d3.select(event.target).attr('data-candidate');
//                 var dataValue = d.label;
//                 var selectedMetric = document.getElementById("line-stat-selection-impact").value;
//                 var date = d.date;
//
//                 var formattedDate = d3.timeFormat("%B %d, %Y")(date);
//                 var formattedDataValue = dataValue % 1 !== 0 ? parseFloat(dataValue).toFixed(2) : dataValue;
//
//                 tooltip.html(`<strong style='color: ${this.candidateColorMap[candidateName.toLowerCase()]};'>${candidateName}</strong><br/>${selectedMetric}: ${formattedDataValue}<br/>Date: ${formattedDate}`)
//                     .style('opacity', 1)
//                     .style('left', (event.pageX + 10) + 'px')
//                     .style('top', (event.pageY - 10) + 'px');
//
//                 this.highlightLine(candidateName);
//                 this.bringToFront(candidateName);
//             })
//             .on('mouseout', () => {
//                 tooltip.style('opacity', 0);
//                 this.restoreLines();
//             });
//
//         // ... (rest of your event handlers and other logic)
//
//         // Define highlightLine, restoreLines, and bringToFront methods within the Chart class
//
//         highlightLine(candidateName) {
//             this.svg.selectAll('.line, .datapoint').classed('dimmed', true);
//             this.svg.selectAll('.line-group').filter(d => d.candidate === candidateName)
//                 .selectAll('.line, .datapoint').classed('highlighted', true);
//             // Additional logic to handle candidate images, if applicable
//             // e.g., d3.select(`#${candidateName}_button`).classed('highlighted', true);
//         }
//
//         restoreLines() {
//             this.svg.selectAll('.line, .datapoint').classed('highlighted', false).classed('dimmed', false);
//             // Additional logic to handle candidate images, if applicable
//             // e.g., d3.selectAll('.candidate_buttons').classed('highlighted', false);
//         }
//
//         bringToFront(candidateName) {
//             this.svg.selectAll('.line-group').filter(d => d.candidate === candidateName).raise();
//             // Additional logic for other elements that need to be brought to the front, if applicable
//         }
//
//         // Sort aggregatedData for line extension labels
//         aggregatedData.sort((a, b) => {
//             let lastY_A = this.yScale(a.values[a.values.length - 1].label);
//             let lastY_B = this.yScale(b.values[b.values.length - 1].label);
//             return lastY_B - lastY_A;
//         });
//
//         let lastLabelYPositions = [];
//
//         aggregatedData.forEach((d) => {
//             let lastPoint = d.values[d.values.length - 1];
//             if (lastPoint.label != null) {
//                 let labelY = this.yScale(lastPoint.label);
//                 for (let pos of lastLabelYPositions) {
//                     if (labelY >= pos - 20) {
//                         labelY = pos - 20;
//                     }
//                 }
//                 lastLabelYPositions.push(labelY);
//
//                 this.svg.append('line')
//                     .attr('class', 'line-extension')
//                     .attr('x1', this.xScale(lastPoint.date))
//                     .attr('y1', this.yScale(lastPoint.label))
//                     .style('stroke', this.candidateColorMap[d.candidate.toLowerCase()])
//                     .attr('x2', this.width - 8)
//                     .transition().duration(1000)
//                     .attr('y2', labelY)
//                     .style('stroke-width', 5)
//                     .style('stroke-dasharray', '3, 3')
//                     .style('opacity', 0.5);
//
//                 this.svg.append('text')
//                     .attr('class', 'line-extension-label')
//                     .attr('x', this.width - 8)
//                     .style('fill', this.candidateColorMap[d.candidate.toLowerCase()])
//                     .style('font-size', '8px')
//                     .attr('dy', '.35em')
//                     .text(d.candidate)
//                     .transition().duration(1000)
//                     .attr('y', labelY);
//             }
//         });
//
//         // Call to updateDynamicTitle and other related functions
//         this.updateDynamicTitle();
//         // updateFullTimelineChart(groupedData, column) // Call this if necessary
//         // updateTimelineVisualization(startDate, endDate, column); // Call this if necessary
//     }
//     // ... (other methods like calculateMidpoint, customLine, etc.)
// }
//
//
// class Timeline {
//     constructor(dataManager) {
//         this.dataManager = dataManager;
//         this.initializeTimeline();
//     }
//
//     initializeTimeline() {
//         // Timeline initialization code
//     }
//
//     updateTimelineVisualization(startDate, endDate, column) {
//         // Timeline update logic
//     }
// }
//
// // Main Execution
// const dataManager = new DataManager();
// const mainChart = new Chart(dataManager);
// const timelineChart = new Timeline(dataManager);
//
// // Event Listeners
// window.addEventListener('resize', () => {
//     // Call appropriate methods to update charts
//     mainChart.updateVisualization();
//     timelineChart.updateTimelineVisualization();
// });
