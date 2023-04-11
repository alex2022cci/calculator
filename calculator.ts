(() => {
    interface Graph {
      canvas: HTMLCanvasElement;
      form: HTMLElement;
      input: HTMLElement;
  
      c: CanvasRenderingContext2D;
  
      orientation: {
        zoom: number;
        x: number;
        y: number;
      };
  
      mouseStart: {
        x: number;
        y: number;
      };
  
      equation: string;
      data: Coord[];
      precision: number;
      zoomPercentage: number;
      sigFigs: number;
      gridSpacing: number;
      maxGridCells: number;
    }
    
    type Coord = [number, number];
  
    enum Directions {
      up,
      down,
      left,
      right
    }
  
    class Graph implements Graph {
      constructor() {
        this.canvas = document.querySelector(".canvas");
        this.form = document.querySelector(".form");
        this.input = document.querySelector(".form__input");
  
        this.c = this.canvas.getContext("2d");
  
        this.orientation = {
          zoom: 1,
          x: this.canvas.width / 2,
          y: this.canvas.height / 2
        };
  
        this.mouseStart = {
          x: null,
          y: null
        };
  
        this.equation = "Math.sin(x / 30) * 100";
  
        this.data = [];
  
        this.precision = 1; // num of pixels traveled horizontally before calculating another coordinate
        this.zoomPercentage = 0.05; // what percent one scroll event will zoom in/out
        this.sigFigs = 3; // significant figures of equation output
        this.gridSpacing = 0.01; // gridSpacing * zoom = number of pixels per grid square
        this.maxGridCells = 3; // the max number of grid cells before increasing the grid spacing factor
  
        this.addEventListeners();
        this.handleResize();
      }
  
      addEventListeners() {
        window.addEventListener("resize", this.handleResize);
        this.form.addEventListener("submit", this.handleSubmit);
        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        window.addEventListener("mousewheel", this.handleScroll);
      }
  
      handleSubmit = e => {
        e.preventDefault();
        
        this.equation = e.target.elements.function.value;
        
        try {
          this.calculate(0)
        } catch(err) {
          alert(`Equation invalid\n\n${err}`);
          return false;
        }
  
  
        this.plot();
      };
  
      handleResize = () => {
        const { innerWidth, innerHeight } = window;
  
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight - 80;
  
        this.orientation.x = innerWidth / 2;
        this.orientation.y = (innerHeight - 80) / 2;
  
        this.plot();
      };
  
      handleMouseDown = ({ offsetX, offsetY }) => {
        this.mouseStart = {
          x: offsetX,
          y: offsetY
        };
        this.canvas.addEventListener("mouseup", this.handleMouseUp);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
      };
  
      handleMouseUp = () => {
        this.canvas.removeEventListener("mouseup", this.handleMouseUp);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
      };
  
      handleMouseMove = e => {
        const { x: startX, y: startY } = this.mouseStart;
        const { offsetX, offsetY } = e;
  
        this.orientation.x = this.orientation.x + (offsetX - startX);
  
        this.orientation.y = this.orientation.y + (offsetY - startY);
  
        this.mouseStart = {
          x: offsetX,
          y: offsetY
        };
  
        this.plot();
      };
  
      handleScroll = e => {
        const { wheelDeltaY, offsetX, offsetY } = e;
  
        let dX = (offsetX - this.canvas.width / 2) / this.canvas.width;
        let dY = (offsetY - this.canvas.height / 2) / this.canvas.height;
  
        const zoomPanFactor = 100;
  
        if (wheelDeltaY > 0) {
          this.orientation.zoom = +(
            this.orientation.zoom *
            (1 + this.zoomPercentage)
          ).toFixed(4);
          this.orientation.x = Math.round(
            this.orientation.x - dX * zoomPanFactor
          );
          this.orientation.y = Math.round(
            this.orientation.y - dY * zoomPanFactor
          );
        } else {
          this.orientation.zoom = +(
            this.orientation.zoom /
            (1 + this.zoomPercentage)
          ).toFixed(4);
          this.orientation.x = Math.round(
            this.orientation.x + dX * zoomPanFactor
          );
          this.orientation.y = Math.round(
            this.orientation.y + dY * zoomPanFactor
          );
        }
  
        this.plot();
      };
  
      calculate(x) {
        const equation = this.equation.replace(/x/gm, x);
        return eval(equation);
      }
  
      calculateSigFigs() {
        this.sigFigs = this.orientation.zoom.toFixed(0).length + 1;
      }
  
      setData() {
        const data = [];
        let x = 0;
  
        while (x < this.canvas.width + this.precision) {
          let _x = x;
  
          // horizontal pan
          _x -= this.orientation.x;
  
          // horizontal zoom
          _x /= this.orientation.zoom;
  
          let y = this.calculate(_x.toFixed(this.sigFigs));
  
          // flip y coordinate because canvas paints \ instead of  /
          y *= -1;
  
          // vertical zoom
          y *= this.orientation.zoom;
  
          // vertical pan
          y += this.orientation.y;
  
          data.push([x, y]);
          x += this.precision;
        }
  
        this.data = data;
      }
  
      plotData() {
        if (!this.data || !this.data.length) return;
  
        this.c.beginPath();
        this.c.moveTo(this.data[0][0], this.data[0][1]);
        this.c.strokeStyle = "rgba(100, 0, 139, 0.7)";
        
        this.data.forEach(([x,y]) => this.c.lineTo(x, y))
  
        this.c.stroke();
      }
  
      plotAxes() {
        const { x, y } = this.orientation;
        const { width, height } = this.canvas;
  
        this.c.strokeStyle = "#000";
        this.c.lineWidth = 2;
  
        // x right
        if (x <= width) {
          this.c.beginPath();
          this.c.moveTo(x, y);
          this.c.lineTo(width, y);
          this.c.stroke();
        }
  
        // x left
        if (x >= 0) {
          this.c.beginPath();
          this.c.moveTo(x, y);
          this.c.lineTo(0, y);
          this.c.stroke();
        }
  
        // y up
        if (y <= height) {
          this.c.beginPath();
          this.c.moveTo(x, y);
          this.c.lineTo(x, height);
          this.c.stroke();
        }
  
        // y down
        if (y >= 0) {
          this.c.beginPath();
          this.c.moveTo(x, y);
          this.c.lineTo(x, 0);
          this.c.stroke();
        }
      }
  
      plotGridSegment(direction: Directions) {
        const {
          gridSpacing,
          orientation: { x, y, zoom },
          canvas: { width, height }
        } = this;
  
        let pt =
          direction === Directions.up || direction === Directions.down ? y : x;
  
        let label: number = 0;
        let index: number = 0;
  
        const setCondition = (point: number): boolean => {
          if (direction === Directions.down) return point < height;
          if (direction === Directions.up) return point > 0;
          if (direction === Directions.left) return point > 0;
          if (direction === Directions.right) return point < width;
          
          return false;
        };
  
        let condition: boolean = setCondition(pt);
  
        while (condition) {
          this.c.strokeStyle =
            index % 5 === 0 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.2)";
          this.c.lineWidth = 1;
          this.c.font = "bold 11px monospace";
  
          // add grid line
          if (direction === Directions.down || direction === Directions.up) {
            this.c.textAlign = "right";
            this.c.beginPath();
            this.c.moveTo(0, pt);
            this.c.lineTo(width, pt);
            this.c.stroke();
          } else if (direction === Directions.left || direction === Directions.right) {
            this.c.textAlign = "center";
            this.c.beginPath();
            this.c.moveTo(pt, 0);
            this.c.lineTo(pt, height);
            this.c.stroke();
          }
  
          // add label
          if (label !== 0 && index % 5 === 0 && index < 1000) {
            const bg: string = new Array(label.toString().length + 2).join("█");
  
            if (direction === Directions.down || direction === Directions.up) {
              this.c.fillStyle = "lightblue";
              this.c.fillText(bg, x - 2, pt + 5);
              this.c.fillStyle = "black";
              this.c.fillText(label.toString(), x - 6, pt + 3);
  
            } else if (direction === Directions.left || direction === Directions.right) {
              this.c.fillStyle = "lightblue";
              this.c.fillText("█", pt, y + 11);
              this.c.fillStyle = "black";
              this.c.fillText(label.toString(), pt, y + 11);
            }
          }
  
          if (index % 5 === 0) label += (direction === Directions.right || direction === Directions.up) ? gridSpacing : -gridSpacing;
  
          // we are dividing here instead of at the gridSpacing variable so
          // that the labels are more round numbers
          if (direction === Directions.down) pt += (gridSpacing / 5) * zoom;
          else if (direction === Directions.up) pt -= (gridSpacing / 5) * zoom;
          else if (direction === Directions.left) pt -= (gridSpacing / 5) * zoom;
          else if (direction === Directions.right) pt += (gridSpacing / 5) * zoom;
          else throw new Error('Invalid direction specified, this will cause an infinite loop')
  
          condition = setCondition(pt);
          index++;
        }
      }
  
      calculateBreakpoint() {
        const {
          maxGridCells,
          canvas: { width, height },
          orientation: { zoom }
        } = this;
  
        const size = Math.max(width, height) / zoom;
        let gridSpacing = 0.025;
  
        const breakpoints = [
          0.05,
          0.1,
          0.25,
          0.5,
          1,
          2,
          5,
          10,
          25,
          50,
          100,
          250,
          500,
          1000,
          2500,
          10000,
          25000,
          50000,
          100000
        ];
  
        let i = 0;
        while (
          breakpoints[i] &&
          breakpoints[i] < size / (maxGridCells + 1)
        ) {
          gridSpacing = breakpoints[i];
          i++;
        }
  
        this.gridSpacing = gridSpacing;
      }
  
      plotGrid = () => {
        this.calculateBreakpoint();
        this.plotGridSegment(Directions.up);
        this.plotGridSegment(Directions.down);
        this.plotGridSegment(Directions.left);
        this.plotGridSegment(Directions.right);
      };
  
      plot() {
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
        this.calculateSigFigs();
        this.setData();
        this.plotAxes();
        this.plotGrid();
        this.plotData();
      }
    }
  
    const graph = new Graph();
  
    graph.plot();
  })();
  