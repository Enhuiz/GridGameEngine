(function () {

    let resolution = 30; // number of grids in one dimension

    class Drawer {
        constructor(resolution) {
            this.resolution = resolution;

            if (resolution > 80) resolution = 80;

            let canvasList = document.getElementsByName('canvas');

            if (canvasList.length === 0) {
                this.canvas = document.createElement('canvas');
                document.body.appendChild(this.canvas);
            }
            else {
                this.canvas = canvasList[0];
            }

            this.canvas.id = 'cvs';

            this.ctx = this.canvas.getContext('2d');

            this.isGridOn = true;

            this.setSize();
            if (this.isGridOn) {
                this._drawGrid();
            }
        }

        setSize() {
            this.canvas.width = window.innerHeight;
            this.canvas.height = window.innerHeight;

            this.canvas.style.position = 'absolute';
            this.canvas.style.left = (window.innerWidth - window.innerHeight) * 0.5 + 'px';

            this.tileSize = Math.floor(this.canvas.height / this.resolution);
        }

        _drawGrid() {

            this.ctx.beginPath();
            this.ctx.lineWidth = 0.3;
            this.ctx.lineStyle = "rgb(0, 0, 0)";

            // horizantal
            for (let y = 0; y <= this.resolution; ++y) {
                this.ctx.moveTo(0, y * this.tileSize);
                this.ctx.lineTo(this.tileSize * this.resolution, y * this.tileSize);
            }

            // vertical
            for (let x = 0; x <= this.resolution; ++x) {
                this.ctx.moveTo(x * this.tileSize, 0);
                this.ctx.lineTo(x * this.tileSize, this.tileSize * this.resolution);
            }

            this.ctx.stroke();
        }

        drawTile(x, y, color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }

        drawTextBox(text, x, y, bgColor, textColor, size = 5, textSize = 1) {
            let textPxSize = textSize * this.tileSize;
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    this.drawTile(i + x, j + y, bgColor);
                }
            }
            this.ctx.fillStyle = textColor;
            this.ctx.font = textPxSize + "px monospace"
            this.ctx.fillText(text,
                (x + size * 0.5) * this.tileSize - text.length * 0.3 * textPxSize,
                (y + size * 0.5) * this.tileSize + 0.3 * textPxSize);
        }

        clear() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.isGridOn) {
                this._drawGrid();
            }
        }
    }

    class Input {
        constructor(resolution) {
            this.mouse = {
                x: 0,
                y: 0,
                isDown: false,
            };

            document.onmousemove = (evt) => {
                let x = evt.pageX || evt.clientX || evt.offsetX || evt.x;
                let y = evt.pageY || evt.clientY || evt.offsetY || evt.y;

                let canvas = document.getElementById('cvs');
                let tileSize = Math.floor(canvas.height / resolution);
                let bbox = canvas.getBoundingClientRect();

                this.mouse.x = (x - bbox.left * (canvas.width / bbox.width)) / tileSize;
                this.mouse.y = (y - bbox.top * (canvas.height / bbox.height)) / tileSize;
                // console.log(this.mouse);
            }

            document.onmousedown = (evt) => {
                this.mouse.isDown = true;
            }

            document.onmouseup = (evt) => {
                this.mouse.isDown = false;
            }
        }
    }

    class MessageBox {
        constructor(text, x, y, bgColor, textColor, size = 5, textSize = 1, duration = 1) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.bgColor = bgColor;
            this.textColor = textColor;
            this.size = 5;
            this.textSize = 1;
            this.lifeTime = duration;
        }

        update(engine) {
            engine.drawer.drawTextBox(this.text, this.x, this.y, this.textColor, this.bgColor, this.size, this.textSize);
            this.lifeTime -= engine.timer.deltaTime;
            if (this.lifeTime < 0) {
                engine.destory(this);
            }
        }
    }

    class Button {
        constructor(text, x, y, bgColor, textColor, size = 5, textSize = 1, onclick) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.bgColor = bgColor;
            this.textColor = textColor;
            this.size = 5;
            this.textSize = 1;
            this.onclick = onclick;
            this._isEverUp = false;
            this._isHovered = false;
        }

        update(engine) {
            if (this._isHovered) {
                this._isEverUp = this._isEverUp || !engine.input.mouse.isDown;
                engine.drawer.drawTextBox(this.text, this.x, this.y, this.textColor, this.bgColor, this.size, this.textSize);
            } else {
                this._isEverUp = false;
                engine.drawer.drawTextBox(this.text, this.x, this.y, this.bgColor, this.textColor, this.size, this.textSize);
            }

            if (engine.input.mouse.x > this.x
                && engine.input.mouse.y > this.y
                && engine.input.mouse.x < this.x + this.size
                && engine.input.mouse.y < this.y + this.size) {
                this._isHovered = true;
            } else {
                this._isHovered = false;
            }

            if (engine.input.mouse.isDown && this._isHovered && this._isEverUp) {
                engine.drawer.drawTextBox(this.text, this.x, this.y, this.bgColor, this.textColor, this.size, this.textSize);
                this.onclick(engine);
            }
        }
    }

    class Engine {
        constructor(fps, drawer, input) {
            this.timer = {
                deltaTime : 0,
                lastTime : 0,
                fps: fps,
            }
            this.drawer = drawer;
            this.input = input;
            this.gameObjects = [];
        }

        start() {
            setInterval(() => { this.update(); }, 1000 / this.timer.fps);
        }

        update() {
            this.drawer.clear();

            for (let i = 0; i < this.gameObjects.length; ++i) {
                this.gameObjects[i].update(this);
            }

            let currentTime = (new Date()).getTime() / 1000;
            this.timer.deltaTime = currentTime - this.timer.lastTime;
            this.timer.lastTime = currentTime;
        }

        instantiate(gameObject) {
            this.gameObjects.push(gameObject);
        }

        destory(gameObject) {
            this.gameObjects = this.gameObjects.filter((element, index, array) => {
                return element !== gameObject;
            });
        }
    }

    // example

    class Faller extends Button{
        constructor(speed, x, y, color, size) {
            super("", x, y, color, color, size, 0, (engine)=>{
                engine.destory(this);
            });
        }

        update(engine) {
            super.update(engine);
            y += speed;
            speed += 0.01 * engine.timer.deltaTime;
        }
    }

    let engine = new Engine(60, new Drawer(resolution), new Input(resolution));

    engine.start();

    engine.instantiate(new Button('Click Me!',
        Math.floor(Math.random() * engine.resolution),
        20,
        'black',
        'white',
        4,
        0.5,
        () => {
            engine.instantiate(new MessageBox("hahahah", 10, 10, 'black', 'white', 8, 1, 0.3));
            engine.instantiate(new );
        }));
})();