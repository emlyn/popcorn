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
        this.setView(0, 0, 1, 0.5);
        this.resize();
    }
    setView(minX, minY, maxX, maxY) {
        const a = this.canvas.width / (maxX - minX);
        const d = this.canvas.height / (minY - maxY);
        const e = -a * minX;
        const f = this.canvas.height - d * minY;
        this.context.setTransform(a, 0, 0, d, e, f);
    }
    getView() {
        const m = this.context.getTransform();
        const w = this.canvas.width;
        const h = this.canvas.height;

        const minx = (h - m.f - m.d * m.e) / (m.d * m.a - m.b);
        const miny = (h - m.b * minx - m.f) / m.d;
        const maxx = (w - m.e) * m.d / (m.a * m.d - m.c * m.f - m.c * m.b);
        const maxy = - (m.f + m.b * maxx) / m.d

        return { minX: minx, minY: miny, maxX: maxx, maxY: maxy };
    }
    aspect() {
        const m = this.context.getTransform();
        return Math.abs(m.a / m.d);
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.mode === 'normal') {
            this.setView(0, 0, 1, 1);
        } else if (this.mode === 'invert') {
            this.setView(0, 0, 1, this.levels);
        } else if (this.mode === 'stretch') {
            this.setView(-this.levels, 0, this.levels, this.levels);
        } else if (this.mode === 'semicircle') {
            this.setView(-this.levels, 0, this.levels, this.levels);
        }
        this.draw();
    }
    draw() {
        this.context.fillStyle = "white";
        const v = this.getView();
        this.context.fillRect(v.minX, v.minY,
                              v.maxX - v.minX,
                              v.maxY - v.minY);
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
}

function resize() {
    popcorn?.resize();
}

function init() {
    const canvas = document.getElementById('canvas');
    popcorn = new Popcorn(canvas);
    document.getElementById('levels').oninput = function() {
        const levels = Math.floor(10**parseFloat(this.value));
        console.log(`Levels changed to ${levels} (${this.value})`);
        document.getElementById('levelsValue').textContent = levels;
        popcorn.levels = levels;
        popcorn.resize();
    }
    for (var el of document.querySelectorAll('input[type="radio"][name="xform"]')) {
        el.onchange = function() {
            console.log(`Transform changed to ${this.value}`);
            popcorn.mode = this.value;
            popcorn.resize();
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
window.addEventListener('resize', resize);
