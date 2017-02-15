(function () {

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
            this.isFrameOn = true;

            this.setSize();
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

        _drawFrame() {
            this.ctx.beginPath();
            this.ctx.lineWidth = 5;
            this.ctx.lineStyle = "rgb(0, 0, 0)";


            for (let y = 0; y <= this.resolution; y += this.resolution) {
                this.ctx.moveTo(0, y * this.tileSize);
                this.ctx.lineTo(this.tileSize * this.resolution, y * this.tileSize);
            }

            // vertical
            for (let x = 0; x <= this.resolution; x += this.resolution) {
                this.ctx.moveTo(x * this.tileSize, 0);
                this.ctx.lineTo(x * this.tileSize, this.tileSize * this.resolution);
            }

            this.ctx.stroke();
        }

        drawTile(x, y, color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize + 0.5, this.tileSize + 0.5);
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
            if (this.isFrameOn) {
                this._drawFrame();
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
        constructor(text, x, y, bgColor, textColor, size = 5, textSize = 1, duration, onVanish) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.bgColor = bgColor;
            this.textColor = textColor;
            this.size = size;
            this.textSize = textSize;
            this.lifeTime = duration;
            this.onVanish = onVanish;
        }

        update(engine) {
            engine.drawer.drawTextBox(this.text, this.x, this.y, this.textColor, this.bgColor, this.size, this.textSize);
            this.lifeTime -= engine.timer.deltaTime;
            if (this.lifeTime != null && this.lifeTime < 0) {
                engine.destory(this);
                this.onVanish(engine);
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
            this.size = size;
            this.textSize = textSize;
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
        constructor(resolution, fps) {
            this.timer = {
                deltaTime: 0,
                lastTime: (new Date()).getTime() / 1000,
                fps: fps,
            }
            this.resolution = resolution;
            this.drawer = new Drawer(resolution);
            this.input = new Input(resolution);
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

        clearScene() {
            this.gameObjects = [];
        }
    }

    // example

    let colors = ["#F44336", "#FFEBEE", "#FFCDD2",
        "#EF9A9A", "#E57373", "#EF5350",
        "#F44336", "#E53935", "#D32F2F",
        "#C62828", "#B71C1C", "#FF8A80",
        "#FF5252", "#FF1744", "#D50000"];

    let sizes = [3, 4, 5, 6, 7, 8, 9, 10];

    let addFaller = function () {
        let x = Math.floor(Math.random() * (engine.resolution - sizes[sizes.length - 1]));
        let size = sizes[Math.floor(Math.random() * sizes.length)];
        engine.instantiate(new Faller(
            Math.random() * 0.1,
            Math.random() * 0.1,
            x,
            0,
            size,
            colors[Math.floor(Math.random() * colors.length)]
        ));
    };

    let score = 0;

    class ScoreBox extends MessageBox {
        constructor(text, x, y, bgColor, textColor, size = 5, textSize = 1) {
            super(text, x, y, bgColor, textColor, size, textSize);
        }

        update(engine) {
            this.text = "Score: " + score;
            super.update(engine);
        }
    }

    let scoreBox = new ScoreBox("Score: " + score, 1, 50, colors[1], colors[0], 9, 1.5);

    let start = function () {
        engine.clearScene();

        engine.instantiate(new Button("Start!", 20, 20, colors[1], colors[0], 20, 2, (engine) => {
            engine.clearScene();
            addFaller();
            engine.instantiate(scoreBox);
        }));
    }

    class Faller extends Button {
        constructor(speed, acceleration, x, y, size, color) {
            super("", x, y, color, "#2196F3", size, 1, (engine) => {
                engine.destory(this);
                ++score;

                let posterityNumbers = [1, 1, 1, 1, 1, 1, 1, 1, 2];
                let posterityNumber = posterityNumbers[Math.floor(Math.random() * posterityNumbers.length)]
                for (let i = 0; i < posterityNumber; ++i) addFaller();
            });
            this.speed = speed;
            this.acceleration = acceleration;
        }

        update(engine) {
            super.update(engine);
            this.y += this.speed;
            this.speed += this.acceleration * engine.timer.deltaTime;
            if (this.y + this.size > engine.resolution) {
                engine.instantiate(new MessageBox("GAME OVER", 20, 20, colors[0], colors[1], 20, 2, 1, () => {
                    start();
                }));
                engine.destory(this);
            }
        }
    }

    let engine = new Engine(60, 60);

    engine.drawer.isGridOn = false;

    engine.start();

    start();

})();