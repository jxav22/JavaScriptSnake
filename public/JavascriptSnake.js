class Coord {
	x;
	y;

	constructor(x = 0, y = 0) {
		this.set(x, y);
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	}

	isEqual(coord) {
		return coord.x === this.x && coord.y == this.y;
	}
}

class Grid {
	element;
	size;
	grid;

	constructor(size) {
		this.grid = Array.from(Array(size), () => new Array(size)); // make 2d array with dimensions: size x size
		this.size = size;

		this.render();
	}

	render() {
		this.element = document.createElement("div");
		this.element.style = `display: grid; grid-template: repeat(${this.size}, 1fr) / repeat(${this.size}, 1fr); background-color: lightgray; height: 100vmin; width: 100vmin;`;
		this.element.id = "JavascriptSnakeGameGrid";

		document.body.appendChild(this.element);
	}

	get(coord) {
		return this.grid[coord.x][coord.y]
	}

	set(coord, value) {
		this.grid[coord.x][coord.y] = value;
	}

	clear(coord) {
		this.grid[coord.x][coord.y] = undefined;
	}

	isEmpty(coord) {
		return typeof this.grid[coord.x][coord.y] === 'undefined'
	}

	getRandomCoord() {
		const getRandomNumber = (max) => {
			return Math.floor(Math.random() * max);
		}

		const coord = new Coord(getRandomNumber(this.size), getRandomNumber(this.size));

		while (!this.isEmpty(coord)) {
			coord.x = getRandomNumber(this.size);
			coord.y = getRandomNumber(this.size);
		}

		return coord;
	}
}

class GameObject {
	grid;
	coord;

	constructor(grid, coord) {
		this.grid = grid;
		this.coord = coord;
	}

	addToGrid() {
		this.grid.set(this.coord, this);
	}

	removeFromGrid() {
		this.grid.clear(this.coord);
	}
}

class OnePixelObject extends GameObject {
	element;
	colour;

	constructor(grid, coord, colour) {
		super(grid, coord);
		this.colour = colour;
		this.render();
	}

	render() {
		super.addToGrid();

		this.element = document.createElement("div");
		this.element.style = `grid-area: ${this.coord.x + 1} / ${this.coord.y + 1}; background-color: ${this.colour}`;
		this.grid.element.append(this.element);
	}

	derender() {
		super.removeFromGrid();

		this.element.remove();
	}
}

class FoodObject extends OnePixelObject {
	constructor(grid, coord) {
		super(grid, coord, 'red');
	}
}

class SnakeObject extends OnePixelObject {
	constructor(grid, coord) {
		super(grid, coord, 'grey');
	}
}

class Node {
	value;
	nextNode;

	constructor(value) {
		this.value = value;
	}

	setNextNode(node) {
		this.nextNode = node;
	}

	getNextNode() {
		return this.nextNode;
	}
}

class Queue {
	head = null;
	tail = null;
	length = 0;

	constructor(value = null) {
		if (value !== null) {
			this.enqueue(value);
		}
	}

	enqueue(value) {
		let newTail = new Node(value);

		if (this.length > 0) {
			this.tail.setNextNode(newTail);
		} else {
			this.head = newTail;
		}
		this.tail = newTail;

		this.length++;
	}

	dequeue() {
		if (this.length > 0) {
			let newHead = this.head.getNextNode();
			let oldHead = this.head;

			oldHead.setNextNode(null);
			this.head = newHead;

			this.length--;
			return oldHead.value;
		}
		return null;
	}

	peak() {
		return this.head.value;
	}
}

class InputHandler {
	maxLength = 3;
	buffer;

	constructor() {
		this.buffer = new Queue();
		this.bindKeyBoardInput();
	}

	getInput() {
		return this.buffer.dequeue();
	}

	bindKeyBoardInput() {
		const inputBuffer = this.buffer;
		const maxLength = this.maxLength;

		const handleInput = (event) => {
			switch (event.key) {
				case "ArrowUp":
					inputBuffer.enqueue(Game.Directions.UP);
					break;
				case "ArrowRight":
					inputBuffer.enqueue(Game.Directions.RIGHT);
					break;
				case "ArrowDown":
					inputBuffer.enqueue(Game.Directions.DOWN);
					break;
				case "ArrowLeft":
					inputBuffer.enqueue(Game.Directions.LEFT);
					break;
			}
		}

		document.addEventListener("keydown", function (event) {
			if (inputBuffer.length < maxLength){
				handleInput(event)
			}			
		});
	}
}

class SnakeAI {
	snake;
	grid;

	movementDirection;
	directionLastMoved;

	constructor(snake, grid) {
		this.snake = snake;
		this.grid = grid;

		this.movementDirection = Game.Directions.UP;
		this.directionLastMoved = this.movementDirection;
	}

	mod(dividend, devisor) {
		return ((dividend % devisor) + devisor) % devisor;
	};

	getNextLocation() {
		const location = this.snake.tail.value.coord;
		const nextLocation = new Coord();

		nextLocation.x = this.mod((location.x + this.movementDirection.x), this.grid.size);
		nextLocation.y = this.mod((location.y + this.movementDirection.y), this.grid.size);

		return nextLocation;
	}

	propogate(coord, grow = false) {
		const newSnakePart = new SnakeObject(this.grid, coord);
		this.snake.enqueue(newSnakePart);

		if (!grow) {
			const oldSnakePart = this.snake.dequeue();
			oldSnakePart.derender();
		}

		this.directionLastMoved = this.movementDirection;
	}

	moveSnake(grow = false) {
		const coord = this.getNextLocation();
		this.propogate(coord, grow);
	}

	setDirection(direction) {
		const isSnakeOneLong = this.snake.length <= 1;
		const isDirectionIntoBody = direction.isEqual(Game.getOppositeDirection(this.directionLastMoved));

		if (isSnakeOneLong || !isDirectionIntoBody) {
			this.movementDirection = direction;
		}
	}
}

class Game {
	static Directions = Object.freeze({
		UP: new Coord(-1, 0),
		DOWN: new Coord(1, 0),
		LEFT: new Coord(0, -1),
		RIGHT: new Coord(0, 1)
	})

	static getOppositeDirection = (direction) => {
		switch (direction) {
			case Game.Directions.UP:
				return Game.Directions.DOWN;
			case Game.Directions.DOWN:
				return Game.Directions.UP;
			case Game.Directions.LEFT:
				return Game.Directions.RIGHT;
			case Game.Directions.RIGHT:
				return Game.Directions.LEFT;
		}
	}

	static PlayState = Object.freeze({
		PLAYING: Symbol("Playing"),
		LOST: Symbol("Lost")
	})

	framerate;
	playState;

	snakeAI;
	inputHandler;

	constructor(size, framerate = 200, startCoord = new Coord(2, 2)) {
		this.grid = new Grid(size);
		this.framerate = framerate;

		const snakeStartPart = new SnakeObject(this.grid, startCoord);
		this.snake = new Queue(snakeStartPart);

		this.snakeAI = new SnakeAI(this.snake, this.grid);
		this.inputHandler = new InputHandler();
		this.start();
	}

	generateFood() {
		const coord = this.grid.getRandomCoord();
		const food = new FoodObject(this.grid, coord);
	}

	gameLoop() {
		const directionalInput = this.inputHandler.getInput();
		if (directionalInput !== null){
			this.snakeAI.setDirection(directionalInput);
		}

		const nextLocation = this.snakeAI.getNextLocation();

		if (this.grid.isEmpty(nextLocation)) {
			this.snakeAI.moveSnake();
		} else {
			const gameObject = this.grid.get(nextLocation);

			if (gameObject instanceof SnakeObject) {
				this.playState = Game.PlayState.LOST;
			} else if (gameObject instanceof FoodObject) {
				this.snakeAI.moveSnake(true);

				gameObject.derender();
				this.generateFood();
			}
		}
	}

	start() {
		this.playState = Game.PlayState.PLAYING;
		this.generateFood();

		const intervalID = setInterval(
			() => {
				this.gameLoop();

				switch (this.playState) {
					case Game.PlayState.LOST:
						clearInterval(intervalID);
						window.alert("YOU LOST");
						break;
				}
			}, this.framerate
		);
	}
}

const game = new Game(50, 200);