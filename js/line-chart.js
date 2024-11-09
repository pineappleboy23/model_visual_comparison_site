/** Class representing the line chart view. */
class LineChart {
    /**
     * Creates a LineChart
     * @param globalApplicationState The shared global application state (has the data and map instance in it)
     */
    constructor(globalApplicationState) {
        // Set some class level variables
        this.globalApplicationState = globalApplicationState;
        this.displayData = [];
        this.yType = this.globalApplicationState.yData;

        // filter bee data for all of US entries
        this.ungrouped_US = globalApplicationState.beeData.filter(function (entry) {
            return entry.State === "United States";
        })
        this.ungrouped = this.ungrouped_US
        this.US = d3.group(this.ungrouped_US, (d) => d.State)

        // default group is US
        this.groups = this.US;

        // apply padding shift to each group in line chart
        d3.select("#line-chart").selectAll("*")
            .attr("transform", `translate( ${this.globalApplicationState.padding * 2}, ${this.globalApplicationState.padding})`);

        // make values shorter to type
        this.height = this.globalApplicationState.svgHeight;
        this.width = this.globalApplicationState.svgWidth;


        d3.select("#x-axis")
            // shift x axis down
            .attr("transform", `translate( ${this.globalApplicationState.padding * 2},  
                ${this.globalApplicationState.padding + this.height})`);

        this.updateSelectedStates()

        // add mouse move listener 
        d3.select("#line-chart").on("mousemove", event => {
            const coords = d3.pointer(event); // relative to element
            const mouseX = coords[0] - this.globalApplicationState.padding*2;
            const mouseY = this.height + this.globalApplicationState.padding - coords[1];

            let date = this.xscale.invert(mouseX);

            this.displayData = [];
            Array.from(this.groups.values()).forEach((group) => {

                let entry = this.findClosestEntry(group, date);

                if (entry !== null) {
                    this.displayData.push(entry);
                }

            })

            this.updateOverlay();

        });

    }

    findClosestEntry(data, targetDate) {
        const target = new Date(targetDate);

        let closestEntry = null;
        let closestDiff = Math.abs(target - new Date(data[0].date));

        data.forEach(entry => {
            const entryDate = new Date(entry.date);
            const diff = Math.abs(entryDate - target);

            // update closestEntry if this is the closest date so far
            if (diff <= closestDiff) {
                closestDiff = diff;
                closestEntry = entry;
            }
        });

        return closestEntry
    }

    updateOverlay() {

        this.displayData.sort((a, b) => {
            return b[this.yType] - a[this.yType];
        });

        // clear overlay
        d3.selectAll("#overlay").selectAll("*").remove();
        let date = new Date(this.displayData[0].date);
        let x = this.xscale(date)


        // draw the vertical line
        d3.select("#overlay")
            .append("line")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", this.height)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        let ogx = x;
        if (x > this.width*.66) {
            x = x - 20
        }
        // draw text
        d3.select("#overlay")
            .selectAll("text")
            .data(this.displayData)
            .enter()
            .append("text")
            .attr("x", x + 10) // X position
            .attr("y", (d, i) => 20 + i * 15) // Y position, stacking with an offset
            .text(d => d.State + ", " + d[this.yType].toLocaleString())
            .attr("font-size", "12px")
            .attr("fill", d => this.colorScale(d.State)) // use color scale
            .attr("text-anchor", ogx > this.width * .66 ? "end" : "start");

    }


    updateSelectedStates() {
        //update yType
        this.yType = this.globalApplicationState.yData;

        // if no selected States, draw US data
        if (this.globalApplicationState.selectedLocations.length === 0) {
            this.groups = this.US;
            this.ungrouped = this.ungrouped_US;
        }
        // else set groups to be selected states
        else {
            // make array for this callback issue
            const selectedLocations = this.globalApplicationState.selectedLocations;
            // filter by selected
            let filteredBeeData = this.globalApplicationState.beeData.filter( entry => {
                return (selectedLocations.includes(entry.State));
            })
            this.ungrouped = filteredBeeData;
            // group by State
            this.groups = d3.group(filteredBeeData, (d) => d.State)
        }

        //draw axes and update scales
        this.drawAxes();

        // clear lines
        d3.selectAll("#lines").selectAll("*").remove();

        // define a color scale 
        this.colorScale = d3.scaleOrdinal()
            //scale maps from iso_code to a color
            .domain(Array.from(this.groups.entries()).map(group => group.value))
            .range(d3.schemeCategory10); // built-in D3 color scheme 


        // draw each line
        Array.from(this.groups.values()).forEach(group => {
            this.drawLineForGroup(group);
        });
    }

    /**
    * create axes and scales
    */
    drawAxes() {

        //----------------------------
        //draw y axis

        // get axis-containing object
        let yg = d3.select("#y-axis");


        // generate scale
        this.yscale = d3.scaleLinear()
            .domain([0, d3.max(this.ungrouped, d => d[this.yType])])
            .range([this.height, 0])
            .nice();

        //create axis
        let yAxis = d3.axisLeft();

        // assign the scale to the axis
        yAxis.scale(this.yscale);

        yg.call(yAxis);




        //----------------------------
        //draw x axis

        // get axis-containing object
        let xg = d3.select("#x-axis");

        // get transform function
        let parseDate = d3.timeParse("%Y-%m-%d");

        // generate scale
        this.xscale = d3.scaleTime()
            .domain(d3.extent(this.ungrouped, d => parseDate(d.date)))
            .range([0, this.width])
            .nice();

        //create axis
        let xAxis = d3.axisBottom()
            .tickFormat(d3.timeFormat("%Y-%m-%d"));

        // assign the scale to the axis
        xAxis.scale(this.xscale);

        // draw axis
        xg.call(xAxis)
            .selectAll("text") // get text labels
            .attr("transform", "rotate(-20)") // rotate labels 
            .style("text-anchor", "end") // end of text is attached to point
            .attr("font-size", Math.floor((this.height) * .02 + 5) + "px")  // scale font size
    }

    /**
    * draw a passed in group
    */
    drawLineForGroup(group) {
        // Define the line generator function
        let lineGenerator = d3.line()
            .x(d => this.xscale(new Date(d.date)))
            .y(d => this.yscale(d[this.yType]));


        let lineGroup = d3.select("#lines").append("g");


        let path = lineGroup.selectAll("path")
            .data([group], d => d.State);


        path.enter()
            .append("path")
            .attr("d", lineGenerator)  // use the line generator to create the d attribute
            .style("fill", "none") // ensure lines are not filled
            .style("stroke", this.colorScale(group[0].State)) // line color from first entries state
            .style("stroke-width", 1.5); // thickness

    }
}
