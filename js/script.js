// ******* DATA LOADING *******
async function loadData() {
    const colonyData = await d3.csv('https://raw.githubusercontent.com/pineappleboy23/DS_data/refs/heads/main/colonies_df.csv');
    const varroaData = await d3.csv('https://raw.githubusercontent.com/pineappleboy23/DS_data/refs/heads/main/varroa_df.csv');
    const mapData = await d3.csv('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json');
    return { colonyData, varroaData, mapData };
}


// ******* STATE MANAGEMENT *******
// communicate across the visualizations
const globalApplicationState = {
    selectedLocations: [],

    colonyData: null,
    varroaData: null,
    mapData: null,

    usMap: null,
    lineChart: null,
};


//******* APPLICATION MOUNTING *******
loadData().then((loadedData) => {

    // Store the loaded data into the globalApplicationState
    globalApplicationState.colonyData = loadedData.colonyData;
    globalApplicationState.varroaData = loadedData.varroaData;
    globalApplicationState.mapData = loadedData.mapData;

    // make all data numerical
    globalApplicationState.colonyData.forEach(d => {
        d.x = +d.x; // convert to number
    });


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