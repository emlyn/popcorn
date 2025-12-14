function showSide() {
    document.body.classList.toggle("showside");
}

let popcorn = undefined;

function gcd(a, b) {
    if (b === 0) return Math.abs(a);
    if (b < 0) return gcd(a, -b);
    return gcd(b, a % b);
}

class Plot {
    static transforms = new Array();
    constructor(name) {
        this.name = name;
        Plot.transforms.push(this);
    }
    static get(name) {
        return Plot.transforms.find(t => t.name.toLowerCase() === name.toLowerCase());
    }
    static list() {
        return Plot.transforms.map(t => t.name);
    }
    static * ratios(minNum, minDen, maxNum, maxDen) {
        for (let j = minDen; j <= maxDen; j++) {
            for (let i = minNum; i <= maxNum(j); i++) {
                if (gcd(i, j) === 1) {
                    yield [i, j];
                }
            }
        }
    }
    initialSize(_levels) {}
    toPoint(_i, _j) {}
    dotRadius(_i, _j) {}
    toRatio(_p) {}
    * ratios(levels) { yield* Plot.ratios(0, 0, d => d, levels); }
}

new class extends Plot {
    constructor() {
        super('Normal');
    }
    initialSize(_levels) {
        return {minX: 0, minY: 0, maxX: 1, maxY: 1};
    }
    toPoint(i, j) {
        return {x: i / j, y: 1 / j};
    }
    dotRadius(_i, j) {
        return 0.03 / j;
    }
    toRatio(p) {
        return [p.x / p.y, 1 / p.y];
    }
}();

new class extends Plot {
    constructor() {
        super('Invert');
    }
    initialSize(levels) {
        return {minX: 0, minY: 0, maxX: 1, maxY: levels};
    }
    toPoint(i, j) {
        return {x: i / j, y: j};
    }
    dotRadius(_i, j) {
        return 0.01 / Math.sqrt(j);
    }
    toRatio(p) {
        return [p.x * p.y, p.y];
    }
}();

new class extends Plot {
    constructor() {
        super('Stretch');
    }
    initialSize(levels) {
        return {minX: -levels, minY: 0, maxX: levels, maxY: levels};
    }
    toPoint(i, j) {
        return {x: (2 * i / j - 1) * j, y: j};
    }
    dotRadius(_i, _j) {
        return 0.5;
    }
    toRatio(p) {
        return [(p.x / p.y + 1) / 2 * p.y, p.y];
    }
}();

new class extends Plot {
    constructor() {
        super('Semicircle');
    }
    initialSize(levels) {
        return {minX: -levels, minY: 0, maxX: levels, maxY: levels};
    }
    toPoint(i, j) {
        const theta = Math.PI * i / j;
        return {x: -j * Math.cos(theta), y: j * Math.sin(theta)};
    }
    dotRadius(_i, _j) {
        return 0.5;
    }
    toRatio(p) {
        const j = Math.sqrt(p.x * p.x + p.y * p.y);
        const theta = Math.acos(-p.x / j);
        const i = theta * j / Math.PI;
        return [i, j];
    }
}();

new class extends Plot {
    constructor() {
        super('Rationals');
    }
    initialSize(levels) {
        return {minX: -levels, minY: 0, maxX: levels, maxY: levels};
    }
    toPoint(i, j) {
        return {x: i, y: j};
    }
    dotRadius(_i, _j) {
        return 0.3;
    }
    toRatio(p) {
        return [p.x, p.y];
    }
    * ratios(levels) { yield* Plot.ratios(-levels, 0, _ => levels, levels); }
}();

class Popcorn {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.levels = 100;
        this.plot = Plot.get('Normal');
        this.colour = 'black';
        this.dragging = false;
        this.rotatemode = 0;
        this.angle = 0;
        this.resize();
        this.resetView();
        canvas.addEventListener('mousedown', this.mousedown.bind(this));
        canvas.addEventListener('mouseup', this.mouseup.bind(this));
        canvas.addEventListener('mousemove', this.mousemove.bind(this));
        canvas.addEventListener('mousewheel', this.mousewheel.bind(this));
        document.addEventListener('keydown', this.keydown.bind(this));
        window.addEventListener('resize', this.resize.bind(this));
        let el = document.getElementById('plotType');
        for (let plotName of Plot.list()) {
            const br = document.createElement('br');
            el.after(br);
            el = br;
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'ptype';
            radio.value = plotName;
            if (plotName === this.plot.name) {
                radio.checked = true;
            }
            const txt = document.createTextNode(' ' + plotName);
            const label = document.createElement('label');
            label.appendChild(radio);
            label.appendChild(txt);
            el.after(label);
            el = label;
            console.log(`Available plot: ${plotName}`);
        }
        console.log(`Popcorn initialized with levels=${this.levels}, mode=${this.plot.name}, colour=${this.colour}`);
    }
    setView(region) {
        const a = this.canvas.width / (region.maxX - region.minX);
        const d = this.canvas.height / (region.minY - region.maxY);
        const e = -a * region.minX;
        const f = this.canvas.height - d * region.minY;
        console.log(`Setting view to region=${JSON.stringify(region)} with transform a=${a}, d=${d}, e=${e}, f=${f}`);
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
    applyRotation() {
        if (this.rotatemode === 1) {
            const p = this.xformPoint({ x: this.canvas.width / 2, y: this.canvas.height / 2 }, this.context.getTransform().inverse());
            this.context.translate(p.x, p.y);
            this.context.rotate(-this.angle);
            this.context.translate(-p.x, -p.y);
        } else if (this.rotatemode === 2) {
            const m = this.context.getTransform();
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.context.rotate(this.angle);
            this.context.translate(-this.canvas.width / 2, -this.canvas.height / 2);
            this.context.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        }
    }
    getTransform() {
        let m;
        try {
            this.context.save();
            this.applyRotation();
            m = this.context.getTransform();
        } finally {
            this.context.restore();
        }
        return m;
    }
    getPoint(screenX, screenY) {
        return this.xformPoint({ x: screenX, y: screenY }, this.getTransform().inverse());
    }
    aspect() {
        // Assumes no rotation or skewing
        const m = this.context.getTransform();
        return Math.abs(m.a / m.d);
    }
    resetView() {
        console.log(`Resetting view for levels=${this.levels}, mode=${this.plot.name}`);
        this.angle = 0;
        this.setView(this.plot.initialSize(this.levels));
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
        console.debug(`Drawing with levels=${this.levels}, mode=${this.plot.name}, colour=${this.colour}`);
        try {
            this.context.save();
            this.context.fillStyle = "white";
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } finally {
            this.context.restore();
        }
        try {
            this.context.save();
            this.applyRotation();
            const r0 = this.plot.dotRadius(0, 0);
            console.debug(`Origin dot radius=${r0}`);
            if (Number.isFinite(r0)) {
                this.context.fillStyle = 'black'
                this.dot({x: 0, y: 0}, r0);
                this.context.fillStyle = 'white'
                this.dot({x: 0, y: 0}, r0 * 0.6);
            }
            for (let [i, j] of this.plot.ratios(this.levels)) {
                if (this.colour == 'black') {
                    this.context.fillStyle = 'black';
                } else if (this.colour == 'value') {
                    this.context.fillStyle = `hsl(${i * 360 / j}, 100%, 40%)`;
                } else if (this.colour == 'denominator') {
                    const d = j - 1;
                    this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                } else if (this.colour == 'numerator') {
                    const d = i - 1;
                    this.context.fillStyle = `hsl(${(d % 10) * 36}, 100%, 40%)`;
                } else if (this.colour == 'symmetric') {
                    const d = Math.min(Math.abs(i), Math.abs(j - Math.abs(i))) - 1;
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
                this.dot(this.plot.toPoint(i, j), this.plot.dotRadius(i, j));
            }
        } finally {
            this.context.restore();
        }
    }
    nearestPoint(x, y) {
        const m = this.getTransform();
        const p = this.xformPoint({x: x, y: y}, m.inverse());
        let [i0, j0] = this.plot.toRatio(p);
        for (let ii = Math.max(0, Math.floor(i0) - 5); ii < Math.max(1, Math.floor(i0) + 5); ii++) {
            for (let jj = Math.floor(j0) - 5; jj < Math.floor(j0) + 5; jj++) {

            }
        }
        return [Math.round(i0), Math.round(j0)];
    }
    showinfo(event) {
        const popup = document.getElementById('popup');
        if (!popup || !popup.classList.contains('visible')) return;
        const [i, j] = this.nearestPoint(event.clientX, event.clientY);
        const p = this.xformPoint(this.plot.toPoint(i, j), this.getTransform());
        popup.style.left = (p.x + 10) + 'px';
        popup.style.top = (p.y - popup.offsetHeight - 10) + 'px';
        popup.innerText = `${i} / ${j}`;
        console.log("info", i, j);
    }
    dot(p, r) {
        let rh = r;
        if (this.rotatemode != 1) rh *= this.aspect();
        this.context.beginPath();
        this.context.ellipse(p.x, p.y, r, rh, 0, 0, Math.PI * 2);
        this.context.fill();
    }
    mousedown(event) {
        if (event.button == 0) {
            this.dragging = true;
        } else if (event.button == 1) {
            console.log(`Middle click: toggling popup`);
            document.getElementById('popup').classList.toggle('visible');
            this.showinfo(event);
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
                if (this.rotatemode !== 0) {
                    this.angle += d.x / 200;
                }
            } else {
                const m = this.getTransform().inverse();
                const a = this.rotatemode === 2 ? this.aspect() : 1;
                const p1 = this.xformPoint(p, m);
                const p2 = this.xformPoint({x: p.x + d.x, y: p.y + d.y}, m);
                this.context.translate((p2.x - p1.x)/a, (p2.y - p1.y)*a);
            }
            this.draw();
        }
        this.showinfo(event);
    }
    mousewheel(event) {
        const p = this.getPoint(event.clientX, event.clientY);
        const scale = Math.pow(1.1, -event.deltaY / 100);
        this.context.translate(p.x, p.y);
        if (event.shiftKey) {
            this.context.scale(1, scale);
        } else if (event.ctrlKey) {
            this.context.scale(scale, 1);
        } else {
            this.context.scale(scale, scale);
        }
        this.context.translate(-p.x, -p.y);
        this.draw();
        this.showinfo(event);
        event.preventDefault();
    }
    keydown(event) {
        if (document.body.classList.contains("showside")) {
            return;
        }
        console.log(`Key down: ${event.key}`, event);
        if (event.key === 'Escape') {
            console.log(`Escape key pressed, resetting view`);
            this.dragging = false;
            this.resetView();
            event.preventDefault();
        } else if (event.key == 'r' && !event.metaKey && !event.ctrlKey && !event.altKey) {
            this.rotatemode = (this.rotatemode + 1) % 3;
            console.log(`Rotation mode changed to ${this.rotatemode}`);
            this.draw();
            event.preventDefault();
        }
    }
}

function init() {
    const canvas = document.getElementById('canvas');
    const popcorn = new Popcorn(canvas);
    document.getElementById('levels').oninput = function() {
        const levels = Math.floor(10**parseFloat(this.value));
        console.log(`Levels changed to ${levels} (${this.value})`);
        document.getElementById('levelsValue').textContent = levels;
        popcorn.levels = levels;
        popcorn.draw();
    }
    for (let el of document.querySelectorAll('input[type="radio"][name="ptype"]')) {
        el.onchange = function() {
            popcorn.plot = Plot.get(this.value);
            console.log(`Transform changed to ${popcorn.plot.name} (${this.value})`);
            popcorn.resetView();
        }
    }
    for (let el of document.querySelectorAll('input[type="radio"][name="colour"]')) {
        el.onchange = function() {
            console.log(`Colour changed to ${this.value}`);
            popcorn.colour = this.value;
            popcorn.draw();
        }
    }
}

window.addEventListener('load', init);
