// ******* DATA LOADING *******
async function loadData() {
    // map data source
    // https://github.com/topojson/us-atlas?tab=readme-ov-file
    const beeData = await d3.csv('https://raw.githubusercontent.com/pineappleboy23/DS_data/refs/heads/main/merged_df.csv');
    const mapData = await d3.csv('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json');
    return { beeData, mapData };
}


// ******* STATE MANAGEMENT *******
// communicate across the visualizations
const globalApplicationState = {
    selectedLocations: [],

    beeData: null,
    mapData: null,

    usMap: null,
    lineChart: null,

    // these are heights minus paddings
    svgWidth: null,
    svgHeight: null,
    gradientWidth: null,
    padding: null
};

//******* SET UP FITTED HTML ITEMS *******
addFittedSVGs();


//******* APPLICATION MOUNTING *******
loadData().then((loadedData) => {

    // Store the loaded data into the globalApplicationState
    globalApplicationState.beeData = loadedData.beeData;
    globalApplicationState.mapData = loadedData.mapData;

    // make all data numerical
    /*
    globalApplicationState.colonyData.forEach(d => {
        d.x = +d.x; // convert to number
    });
    */


    // init line chart and add it to global state 
    const lineChart = new LineChart(globalApplicationState);
    globalApplicationState.lineChart = lineChart;


    // init map and add it to global state 
    const usMap = new MapVis(globalApplicationState);
    globalApplicationState.usMap = usMap;

    // add a click listener to clear button
    d3.select("#clear-button").on("click", function (event) {
        globalApplicationState.selectedLocations = [];
        usMap.drawMap();
    });
});

function addFittedSVGs() {
    //--------------------------
    // do screen size math
    const MAP_WIDTH_TO_HEIGHT_RATIO = 2.75;
    const GRADIENT_WIDTH_RATIO = .1;
    const PADDING_PERCENT = .05; //percent of screen space on either side of each map

    // get screen width
    let screenWidth = window.innerWidth;

    // make each piece proportionally sized
    //                                PADDING_PERCENT of one display
    globalApplicationState.padding = Math.round((screenWidth / 2) * PADDING_PERCENT);
                                   // half of width minus padding
    globalApplicationState.svgWidth = Math.round(screenWidth / 2 - globalApplicationState.padding * 2);
                                        // width divided by ratio
    globalApplicationState.svgHeight = Math.round(globalApplicationState.svgWidth / MAP_WIDTH_TO_HEIGHT_RATIO);
                                              // width * gradient ratio
    globalApplicationState.gradientWidth = Math.round(globalApplicationState.svgWidth * GRADIENT_WIDTH_RATIO);

    //---------------------------------
    //add html content

    const width = globalApplicationState.svgWidth + globalApplicationState.padding * 2;
    const height = globalApplicationState.svgHeight + globalApplicationState.padding * 2;

    // Select the content div
    const contentDiv = d3.select("#content");

    // Append the map SVG element
    const mapSVG = contentDiv.append("svg")
        .attr("id", "map")
        .attr("width", width)
        .attr("height", height);

    // Add g elements inside map SVG
    mapSVG.append("g").attr("id", "country-outline");
    mapSVG.append("g").attr("id", "states");

    // Append the line-chart SVG element
    const lineChartSVG = contentDiv.append("svg")
        .attr("id", "line-chart")
        .attr("width", width)
        .attr("height", height);

    // Add g elements inside line-chart SVG
    lineChartSVG.append("g").attr("id", "x-axis");
    lineChartSVG.append("g").attr("id", "y-axis");
    lineChartSVG.append("g").attr("id", "lines");

    // Add the overlay group with a line inside
    lineChartSVG.append("g")
        .attr("id", "overlay")
        .append("line");

    // Append the button at the end of the content div
    contentDiv.append("button")
        .attr("id", "clear-button")
        .text("Clear Selected States");
}