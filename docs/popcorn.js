function showSide() {
    document.body.classList.toggle("showside");
}

var popcorn = undefined;

function gcd(a, b) {
    if (b === 0) return a;
    return gcd(b, a % b);
}

class Popcorn {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.levels = 100;
        this.mode = 'normal';
        this.colour = 'black';
        this.dragging = false;
        this.resize();
        this.resetView();
        canvas.addEventListener('mousedown', this.mousedown.bind(this));
        canvas.addEventListener('mouseup', this.mouseup.bind(this));
        canvas.addEventListener('mousemove', this.mousemove.bind(this));
        canvas.addEventListener('mousewheel', this.mousewheel.bind(this));
        document.addEventListener('keydown', this.keydown.bind(this));
        window.addEventListener('resize', this.resize.bind(this));
        console.log(`Popcorn initialized with levels=${this.levels}, mode=${this.mode}, colour=${this.colour}`);
    }
    setView(minX, minY, maxX, maxY) {
        const a = this.canvas.width / (maxX - minX);
        const d = this.canvas.height / (minY - maxY);
        const e = -a * minX;
        const f = this.canvas.height - d * minY;
        this.context.setTransform(a, 0, 0, d, e, f);
    }
    getView() {
        const mi = this.context.getTransform().inverse();
        const w = this.canvas.width;
        const h = this.canvas.height;
        const p1 = this.xformPoint({ x: 0, y: 0 }, mi);
        const p2 = this.xformPoint({ x: w, y: h }, mi);

        return { minX: p1.x, minY: p2.y, maxX: p2.x, maxY: p1.y };
    }
    xformPoint(p, m) {
        return {
            x: m.a * p.x + m.b * p.y + m.e,
            y: m.c * p.x + m.d * p.y + m.f,
        };
    }
    getPoint(screenX, screenY) {
        const m = this.context.getTransform().inverse();
        return this.xformPoint({ x: screenX, y: screenY }, m);
    }
    aspect() {
        // Assumes no rotation or skewing
        const m = this.context.getTransform();
        return Math.abs(m.a / m.d);
    }
    resetView() {
        console.log(`Resetting view for levels=${this.levels}, mode=${this.mode}`);
        if (this.mode === 'normal') {
            this.setView(0, 0, 1, 1);
            console.log(`Setting view for normal mode`, this.context.getTransform());
        } else if (this.mode === 'invert') {
            this.setView(0, 0, 1, this.levels);
        } else if (this.mode === 'stretch') {
            this.setView(-this.levels, 0, this.levels, this.levels);
        } else if (this.mode === 'semicircle') {
            this.setView(-this.levels, 0, this.levels, this.levels);
        } else {
            console.error(`Unknown mode: ${this.mode}`);
        }
        this.draw();
    }
    resize() {
        // Prevent transform from resetting on resize
        const m = this.context.getTransform();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
        this.draw();
    }
    draw() {
        console.debug(`Drawing with levels=${this.levels}, mode=${this.mode}, colour=${this.colour}`);
        this.context.save();
        this.context.fillStyle = "white";
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
        //const v = this.getView();
        for (let i = 0; i <= this.levels; i++) {
            for (let j = 0; j <= i; j++) {
                if (gcd(i, j) === 1) {
                    if (this.colour == 'black') {
                        this.context.fillStyle = 'black';
                    } else if (this.colour == 'value') {
                        this.context.fillStyle = `hsl(${j * 360 / i}, 100%, 40%)`;
                    } else if (this.colour == 'denominator') {
                        const d = i - 1;
                        this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                    } else if (this.colour == 'numerator') {
                        const d = j - 1;
                        this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                    } else if (this.colour == 'symmetric') {
                        const d = Math.min(j, Math.abs(i - j)) - 1;
                        this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                    } else if (this.colour == 'ratio') {
                        const d = j == 0 ? 0 : (Math.floor(36 * i / j) - 36) % 360;
                        this.context.fillStyle = `hsl(${d}, 100%, 40%)`;
                    } else if (this.colour == 'quotient') {
                        const d = j == 0 ? 0 : Math.floor(i / j) - 1;
                        this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                    } else if (this.colour == 'remainder') {
                        const d = j == 0 ? 0 : i % j;
                        this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                    }
                    if (this.mode === 'normal') {
                        const r = 0.03/i;
                        this.plot(j/i, 1/i, r);
                    } else if (this.mode === 'invert') {
                        const r = 0.01/Math.sqrt(i);
                        this.plot(j/i, i, r);
                    } else if (this.mode === 'stretch') {
                        this.plot((2*j/i-1)*i, i, 0.5);
                    } else if (this.mode === 'semicircle') {
                        const theta = Math.PI * j / i;
                        this.plot(-i*Math.cos(theta), i*Math.sin(theta), 0.5);
                    }
                }
            }
        }
    }
    plot(x, y, r) {
        const rh = r * this.aspect();
        this.context.beginPath();
        this.context.ellipse(x, y, r, rh, 0, 0, Math.PI * 2);
        this.context.fill();
    }
    mousedown(event) {
        if (event.button == 0) {
            this.dragging = true;
        }
        event.preventDefault();
    }
    mouseup(event) {
        if (event.button == 0) {
            this.dragging = false;
        }
        event.preventDefault();
    }
    mousemove(event) {
        const p = {x: event.clientX, y: event.clientY};
        const d = {x: event.movementX, y: event.movementY};
        if (this.dragging && (d.x !== 0 || d.y !== 0)) {
            if (event.shiftKey) {
                // Rotate around the mouse position(?)
            } else {
                const m = this.context.getTransform().inverse();
                const p1 = this.xformPoint(p, m);
                const p2 = this.xformPoint({x: p.x + d.x, y: p.y + d.y}, m);
                this.context.translate(p2.x - p1.x, p2.y - p1.y);
            }
            this.draw();
        }
    }
    mousewheel(event) {
        const p = this.getPoint(event.clientX, event.clientY);
        const scale = Math.pow(1.1, -event.deltaY / 100);
        if (event.shiftKey) {
            const m = this.context.getTransform();
            const p0 = this.xformPoint(p, m);
            this.context.setTransform(1,0,0,1,0,0);
            this.context.translate(p0.x, p0.y);
            this.context.scale(1, scale);
            this.context.translate(-p0.x, -p0.y);
            this.context.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        } else if (event.ctrlKey) {
            const m = this.context.getTransform();
            const p0 = this.xformPoint(p, m);
            this.context.setTransform(1,0,0,1,0,0);
            this.context.translate(p0.x, p0.y);
            this.context.scale(scale, 1);
            this.context.translate(-p0.x, -p0.y);
            this.context.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        } else {
            this.context.translate(p.x, p.y);
            this.context.scale(scale, scale);
            this.context.translate(-p.x, -p.y);
        }
        this.draw();
        event.preventDefault();
    }
    keydown(event) {
        if (document.body.classList.contains("showside")) {
            return;
        }
        console.log(`Key down: ${event.key}`);
        if (event.key === 'Escape') {
            console.log(`Escape key pressed, resetting view`);
            this.dragging = false;
            this.resetView();
            event.preventDefault();
        }
    }
}

function init() {
    const canvas = document.getElementById('canvas');
    popcorn = new Popcorn(canvas);
    document.getElementById('levels').oninput = function() {
        const levels = Math.floor(10**parseFloat(this.value));
        console.log(`Levels changed to ${levels} (${this.value})`);
        document.getElementById('levelsValue').textContent = levels;
        popcorn.levels = levels;
        popcorn.resetView();
    }
    for (var el of document.querySelectorAll('input[type="radio"][name="xform"]')) {
        el.onchange = function() {
            console.log(`Transform changed to ${this.value}`);
            popcorn.mode = this.value;
            popcorn.resetView();
        }
    }
    for (var el of document.querySelectorAll('input[type="radio"][name="colour"]')) {
        el.onchange = function() {
            console.log(`Colour changed to ${this.value}`);
            popcorn.colour = this.value;
            popcorn.resize();
        }
    }
}

window.addEventListener('load', init);
