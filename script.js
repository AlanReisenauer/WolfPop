const alpha = 0.04, beta = 0.0005, delta = 0.0001, gamma = 0.06, dt = 0.1;      
let elk = 400, wolves = 21; 
let elkHistory = [], wolfHistory = [], realWolfData = [];
const startYear = 1995, pixelsPerYear = 25; 

function preload() {
    loadJSON('data/wolf_population.json', function(data) {
        realWolfData = Object.values(data);
    });
}

function setup() {
    createCanvas(800, 400);
    elkHistory.push(elk);
    wolfHistory.push(wolves);
}

function draw() {
    background(30);
    drawRealData(realWolfData, color(100, 100, 100, 150), "Real Wolves (NPS)", 60);

    let nextElk = elk + (alpha * elk - beta * elk * wolves) * dt;
    let nextWolves = wolves + (delta * elk * wolves - gamma * wolves) * dt;
    
    elk = max(0, nextElk); wolves = max(0, nextWolves);
    elkHistory.push(elk); wolfHistory.push(wolves);
    
    if (elkHistory.length > width) { elkHistory.shift(); wolfHistory.shift(); }
    
    drawGraph(elkHistory, color(100, 200, 100), "Simulated Elk", 20);
    drawGraph(wolfHistory, color(200, 100, 100), "Simulated Wolves", 40);
}

function drawRealData(dataArray, lineColor, label, yOffset) {
    if (dataArray.length === 0) return; 
    noFill(); stroke(lineColor); strokeWeight(3); drawingContext.setLineDash([5, 5]); 
    beginShape();
    for (let i = 0; i < dataArray.length; i++) {
        let x = (dataArray[i].year - startYear) * pixelsPerYear;
        let y = height - map(dataArray[i].wolves, 0, 200, 0, height);
        let scrolledX = x - max(0, wolfHistory.length - width);
        vertex(scrolledX, y);
        push(); fill(lineColor); noStroke(); circle(scrolledX, y, 6); pop();
    }
    endShape(); drawingContext.setLineDash([]); 
    fill(lineColor); noStroke(); textSize(16); text(label, 20, yOffset);
}

function drawGraph(historyArray, lineColor, label, yOffset) {
    noFill(); stroke(lineColor); strokeWeight(2);
    beginShape();
    for (let i = 0; i < historyArray.length; i++) {
        let y = height - map(historyArray[i], 0, label === "Simulated Elk" ? 800 : 200, 0, height);
        vertex(i, y);
    }
    endShape();
    fill(lineColor); noStroke(); textSize(16);
    text(`${label}: ${floor(historyArray[historyArray.length - 1])}`, 20, yOffset);
}