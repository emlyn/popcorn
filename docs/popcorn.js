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
        this.view = {
            minX: 0,
            minY: 0,
            maxX: 1,
            maxY: 0.5,
        };
        this.resize();
    }
    resize() {
        if (this.mode === 'normal') {
            this.view.minX = 0;
            this.view.maxX = 1;
            this.view.maxY = 0.5;
        } else if (this.mode === 'invert') {
            this.view.minX = 0;
            this.view.maxX = 1;
            this.view.maxY = this.levels;
        } else if (this.mode === 'stretch') {
            this.view.minX = -this.levels;
            this.view.maxX = this.levels;
            this.view.maxY = this.levels;
        } else if (this.mode === 'semicircle') {
            this.view.minX = -this.levels;
            this.view.maxX = this.levels;
            this.view.maxY = this.levels;
        }

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const v = this.view;
        const a = this.canvas.width / (v.maxX - v.minX);
        const d = this.canvas.height / (v.minY - v.maxY);
        const e = -a * v.minX;
        const f = this.canvas.height - d * v.minY;
        this.context.setTransform(a, 0, 0, d, e, f);
        this.scaleX = this.canvas.width / (v.maxX - v.minX);
        this.scaleY = this.canvas.height / (v.maxY - v.minY);
        this.aspect = Math.abs(this.scaleX / this.scaleY);
        this.draw();
    }
    draw() {
        for (let i = 0; i <= this.levels; i++) {
            for (let j = 0; j <= i; j++) {
                if (gcd(i, j) === 1) {
                    if (this.mode === 'normal') {
                        const r = 0.03/i;
                        this.plot(j/i, 1/i, r);
                    } else if (this.mode === 'invert') {
                        const r = 0.01/Math.sqrt(i);
                        this.plot(j/i, i, r);
                    } else if (this.mode === 'stretch') {
                        const r = 0.5;
                        this.plot((2*j/i-1)*i, i, r);
                    } else if (this.mode === 'semicircle') {
                        const theta = Math.PI * j / i;
                        // const r = 0.5;
                        this.plot(i*Math.cos(theta), i*Math.sin(theta), 0.5);
                    }
                }
            }
        }
    }
    plot(x, y, r) {
        const rh = r * this.aspect;
        this.context.beginPath();
        this.context.ellipse(x, y, r, rh, 0, 0, Math.PI * 2);
        this.context.fill();
    }
}

function resize() {
    if (popcorn) {
        popcorn.resize();
    }
}

function init() {
    const canvas = document.getElementById('canvas');
    popcorn = new Popcorn(canvas);
    document.getElementById('levels').oninput = function() {
        console.log('Levels changed to', this.value);
        const levels = Math.floor(10**parseFloat(this.value));
        document.getElementById('levelsValue').textContent = levels;
        popcorn.levels = levels;
        popcorn.resize();
    }
    for (var el of document.querySelectorAll('input[type="radio"][name="xform"]')) {
        el.onchange = function() {
            console.log('Transform changed to', this.value);
            popcorn.mode = this.value;
            popcorn.resize();
        }
    }
}

window.addEventListener('load', init);
window.addEventListener('resize', resize);
