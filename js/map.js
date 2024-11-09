/** Class representing the map view. */
class MapVis {
    /**
     * Creates a Map Visuzation
     * @param globalApplicationState The shared global application state (has the data and the line chart instance in it)
     */
    constructor(globalApplicationState) {
        //------------------------
        //setup
        //setup drawing objects

        this.globalApplicationState = globalApplicationState;

        // make values shorter to type
        this.height = this.globalApplicationState.svgHeight;
        this.width = this.globalApplicationState.svgWidth;


        // Set up the map projection
        this.projection = d3.geoAlbersUsa()
            .translate([this.width / 2, this.height / 2]) // this centers the map in our SVG element
            .scale([this.width*1.3]); // this specifies how much to zoom

        this.path = d3.geoPath()
            .projection(this.projection);

        // convert topojson to geojson
        //this.geoJSON = topojson.feature(this.globalApplicationState.mapData, this.globalApplicationState.mapData.objects.states);
        // i found data already in geo format
        this.geoJSON = this.globalApplicationState.mapData;

        // apply padding shift to map
        d3.select("#states")
            .attr("transform", `translate( ${this.globalApplicationState.padding}, ${this.globalApplicationState.padding})`);

        // bind correct data to geoJSON
        // this calls draw map
        this.updateDataType();
    }

    updateDataType() {
        //--------------------------
        //bind bee data

        // group the bee data by state and find average for each group
        // yippee dictionaries
        const averageValueByState = {};
        this.max = 0;

        // loop through bee data  find the average for each state
        this.globalApplicationState.beeData.forEach((entry) => {

            let state = entry.State;
            //                       data type is gotteh through global object
            let dataOfType = entry[this.globalApplicationState.yData];

            if (dataOfType > this.max) {
                this.max = dataOfType;
            }

            // initialize the state if it doesn't exist
            if (!averageValueByState[state]) {
                averageValueByState[state] = { sum: 0, count: 0, name: state };
            }


            // add to data
            averageValueByState[state].sum += dataOfType;
            averageValueByState[state].count += 1;
        });

        // calculate the mean for each state
        for (const state in averageValueByState) {
            const { sum, count } = averageValueByState[state];
            averageValueByState[state].mean = sum / count;
        }


        // add the bee data to the geo json object

        this.geoJSON.features.forEach((feature) => {
            const state = feature.properties.name;

            // if theres a average for this state, add it to properties
            if (averageValueByState[state] !== undefined) {
                feature.properties.data = averageValueByState[state].mean;
            } else {
                //if data missing
                feature.properties.data = 0;
            }
        });


        this.maxAverage = d3.max(Object.values(averageValueByState), d => {
            if (d.name === "United States") {
                return 0;
            } else {
                return d.mean;
            }
        });

        //------------------
        //create color scale

        this.color = d3.scaleSequential(d3.interpolateRgb("#ffffff", "#ff0000"));

        // 0 to max average
        this.color.domain([0, this.maxAverage]);

        //draw map
        this.drawMap();
    }

    /*
     * in this function, this.globalApplicationState is passed in
     */
    updateSelectedStates(globalApplicationState, d) {
        // print data
        console.log(d);
        console.log(d.properties);

        // toggle selected state
        const state = d.properties.name;
        const index = globalApplicationState.selectedLocations.indexOf(state);

        // if not selected
        // add it to the selected array
        if (index === -1) {
            globalApplicationState.selectedLocations.push(state);

            // if already selected
            // remove it from the selected array
        } else {

            globalApplicationState.selectedLocations.splice(index, 1);
        }

        // redraw map
        this.drawMap();



    }

    drawMap() {
        // delete old stuff
        d3.select("#states").selectAll("*").remove();

        // filter for alaska first
        // it had no data and got in the way of the legend
        let noAlaska = this.geoJSON.features.filter(d => d.properties.name !== "Alaska");

        // draw state data
        d3.select("#states").selectAll("path")
            .data(noAlaska)
            .join("path")
            .attr("class", d => {
                // if in selectedLocations -> class is selected
                return this.globalApplicationState.selectedLocations.includes(d.properties.name) ? "state selected" : "state";
            })
            .attr("d", d => {
                return this.path(d.geometry);
            })
            //map the data value to a color
            .style("fill", d => this.color(d.properties.data))
            // click event listener
            .on("click", (event, d) => this.updateSelectedStates(this.globalApplicationState, d));



        this.drawScale();
        //whenever we redraw the map we need to redraw the line chart too
        this.globalApplicationState.lineChart.updateSelectedStates();
    }

    drawScale() {
        // delete old stuff
        d3.select("#legend").selectAll("*").remove();

        const svg = d3.select("#legend");

        const defs = svg.append("g");

        const linearGradient = defs.append("linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%") //left is white 0%
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");   // right is red 100%

        // color checkpoints
        linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: "#ffffff" }, // white
                { offset: "100%", color: "#ff0000" } // red
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // add rect to hold gradient
        svg.append("rect")
            .attr("x", this.globalApplicationState.padding)
            .attr("y", this.globalApplicationState.svgHeight)
            .attr("width", globalApplicationState.gradientWidth)
            .attr("height", globalApplicationState.gradientWidth / 4)
            .attr("stroke", "black") // outline color
            .attr("stroke-width", 1) // outline width
            .style("fill", "url(#gradient)");  // use the gradient fill

        svg.append("text")
            .attr("x", this.globalApplicationState.padding)
            .attr("id", "left")
            .attr("y", this.globalApplicationState.svgHeight - 13)
            .text("0")
            .attr("font-size", "12px")
            .attr("fill", "black");

        svg.append("text")
            .attr("x", globalApplicationState.gradientWidth + this.globalApplicationState.padding)
            .attr("y", this.globalApplicationState.svgHeight - 13)
            .attr("id", "right")
            .attr("text-anchor", "middle")
            .text(Math.floor(this.maxAverage).toLocaleString())
            .attr("font-size", "12px")
            .attr("fill", "black");

    }




}