/// <reference types="three" />
/// <reference types="howler" />
//Picking Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html


const scene: THREE.Scene = new THREE.Scene();
const pickingScene: THREE.Scene = new THREE.Scene();
pickingScene.background = new THREE.Color(900);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
var screenWidth = window.innerWidth / 22;
let font: THREE.Font | null = null;
let canvas = document.getElementById('canvas');
let lastMousePos: MouseEvent;
let background: THREE.Mesh;

const addLetterSound = new Howl({
    src: ['./sounds/letter.wav']
});

const clickLetterSound = new Howl({
    src: ['./sounds/add.wav']
});

const smackSound = new Howl({
    src: ['./sounds/smack.wav']
});

new THREE.FontLoader().load('fonts/helvetiker_bold.typeface.json', f => font = f);
let snowFlakeImage: THREE.Texture;
new THREE.TextureLoader().load('imgs/snow_flake.png', f => {
    snowFlakeImage = f;

    let snowFlakes = 500;
    for (let i = 0; i < snowFlakes; i++) {
        let flake = new SnowFlake();
        scene.add(flake.mesh);
        snowflakes.push(flake);
    }
});

new THREE.TextureLoader().load('imgs/background.jpg', f => {
    // f.repeat.set(.5, .5);
    // backgroundSize = new THREE.Vector2(f.image.width, f.image.height);
    // scene.background = f
    let g = new THREE.PlaneGeometry(f.image.width, f.image.height);
    let m = new THREE.MeshBasicMaterial({
        map: f
    });
    background = new THREE.Mesh(g, m);
    background.position.z = -50;
    scene.add(background)
});

function randomNumber(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

interface HangingLetter {
    mesh: THREE.Mesh
    height: number,
    width: number,
    letter: string
}

interface HangingString {
    mesh: THREE.Mesh,
    height: number
    currentY: number,
    y: number
    down: boolean,
    moveLeft: boolean | null,
    currentX: number,
    x: number
}

interface HangingThing {
    letter: HangingLetter | null,
    string: HangingString
    id: number,
    pickedLetter?: HangingLetter | null,
    pickedString?: HangingString,
    rotation?: {
        totalRotation: number,
        currentRotation: number,
        speed: number,
        decelerate: number,
        startTime: number | null
    },
    swingStartTime?: number
}

// var localLettercount = 0;

class SnowFlake {

    mesh: THREE.Mesh;
    velocity: THREE.Vector2;

    constructor() {
        let material = new THREE.MeshBasicMaterial({
            color: 'white'
        });
        let geometry = new THREE.CircleGeometry(randomNumber(0, 2));

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.x = randomNumber(-screenWidth * 2, screenWidth * 2);

        this.mesh.position.y = randomNumber(0, 300);
        this.mesh.position.z = randomNumber(-50, 0);
        this.velocity = new THREE.Vector2(randomNumber(-1, 1), randomNumber(.5, 1));

    }
}

let hangingThings: HangingThing[] = [];
let droppingThings: HangingThing[] = [];
let snowflakes: SnowFlake[] = [];

function updateHangingPositions() {
    // let x = -screenWidth / 2;

    let space = screenWidth / 6;
    let x = -space / 2 * hangingThings.length;
    for (let index = 0; index < hangingThings.length; index++) {
        let thing = hangingThings[index];
        if (thing) {
            // if (x > thing.string.mesh.position.x){
            //     thing.string.moveLeft = false;
            //     thing.string.currentX = thing.string.mesh.position.x;
            //     thing.string.x = x;
            //     if (thing.pickedString) {
            //         thing.pickedString.moveLeft = false;
            //         thing.pickedString.currentX = thing.pickedString.mesh.position.x;
            //         thing.pickedString.x = x;
            //     }
            // } else {
            //     thing.string.moveLeft = true;
            //     thing.string.currentX = thing.string.mesh.position.x;
            //     thing.string.x = x;
            //     if (thing.pickedString) {
            //         thing.pickedString.moveLeft = true;
            //         thing.pickedString.currentX = thing.pickedString.mesh.position.x;
            //         thing.pickedString.x = x;
            //     }
            // }

            thing.string.mesh.position.x = x;
            if (thing.pickedString) {
                thing.pickedString.mesh.position.x = x;
            }

            x += space;
        } else {
            x += space;
        }

    }
}

/**
 * When window resizes
 */
function onResize() {
    if (canvas) {
        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        if (window.innerHeight < height){
            height = window.innerHeight
        }
        camera.aspect = width / height;
        screenWidth = width / 22;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        if (background) {
            background.position.set(0, 0, -50)
        }
        updateHangingPositions()
    }
}

init();

function isLetter(str: string) {
    return str.length === 1 && str.match(/[a-z]/i);
}

function onKeyPressed(e: KeyboardEvent) {
    if (e.keyCode == 32) {
        e.preventDefault();
    }

    if (e.code == 'Backspace') {
        let thing = hangingThings[hangingThings.length - 1];
        let id = hangingThings.length - 1;
        let temp = hangingThings.filter(t => t.string.down);
        if (temp.length > 0) {
            thing = temp[temp.length - 1];
        }
        if (thing) {
            if (thing.string.down) {
                clickLetterSound.play();
                // scene.remove(thing.string.mesh);
                // if (thing.pickedString) {
                //     scene.remove(thing.pickedString.mesh);
                // }
                thing.string.down = false;
                thing.string.y = 4 * (65 - thing.string.height / 2);
                if (thing.pickedString) {
                    thing.pickedString.down = false;
                    thing.pickedString.y = 4 * (65 - thing.pickedString.height / 2)
                }
                droppingThings.push(thing);
                hangingThings = hangingThings.filter(t => t !== thing);
                updateHangingPositions()
            }

            // updateHangingPositions();
        } else {
            delete hangingThings[id];
        }
    } else if (isLetter(e.key)) {
        // localLettercount++;
        createHangingThing(e.key);
    } else if (e.code == 'Space') {
        // localLettercount++;
        createHangingThing(' ')
    }
}

function onMouseClicked(e: MouseEvent) {
    var pos = {x: e.x, y: e.y};
    pos.x = (pos.x) * 2 - 1;
    pos.y = (pos.y) * -2 + 1;  // note we flip Y
    let hangingItem = GPUPickerHelper.pick({x: e.x, y: e.y});
    if (hangingItem && !hangingItem.rotation) {
        smackSound.play();
        spinLetter(e.x, hangingItem)
    }
}

function spinLetter(x: number, hangingItem: HangingThing) {
    if (!canvas) {
        return
    }
    var pos = hangingItem.string.mesh.position.clone();
    pos.project(camera);
    pos.x = (pos.x * canvas.clientWidth / 2) + canvas.clientWidth / 2;
    pos.y = -(pos.y * canvas.clientHeight / 2) + canvas.clientHeight / 2;

    let mid = pos.x;
    let distanceFromMid = Math.abs(x - mid);

    let spins = Math.ceil(distanceFromMid / 10);
    hangingItem.rotation = {
        totalRotation: 360 * spins,
        currentRotation: 0,
        speed: spins * 100,
        decelerate: -2,
        startTime: null
    }
}

function onMouseMoved(e: MouseEvent) {
    if (!lastMousePos || !background) {
        lastMousePos = e;
        return
    }
    let diffX = (e.x - lastMousePos.x) / 10;
    let diffY = (e.y - lastMousePos.y) / 10;

    background.position.x += diffX;
    background.position.y += diffY;
    lastMousePos = e;
}

function init() {
    window.addEventListener('resize', onResize, false);
    window.addEventListener('keydown', onKeyPressed);
    document.addEventListener('click', onMouseClicked);
    document.addEventListener('mousemove', onMouseMoved);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color('black'));

    // position and point the camera to the center of the scene
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);


    if (canvas) {
        canvas.appendChild(renderer.domElement);
        onResize()
    }
    // add the output of the renderer to the html element
}

function createHangingString(): HangingString {
    let h = 0;
    if (canvas) {
        h = randomNumber(canvas.clientHeight, canvas.clientHeight * 2);
    }
    let height = h / 20;
    let geometry = new THREE.BoxGeometry(.5, height, .5);
    let material = new THREE.MeshBasicMaterial({
        color: 'white'
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.name = hangingThings.length + 's';
    mesh.position.set(0, 0, 0);
    return {
        mesh: mesh,
        height: height,
        currentY: 2 * (65 - height / 2),
        y: 65 - height / 2,
        down: true,
        moveLeft: true,
        currentX: screenWidth,
        x: 0
    };
}

function createHangingLetter(letter: string): HangingLetter | null {
    if (!font) {
        return null;
    }
    let options: THREE.TextGeometryParameters = {
        font: font,
        size: 5,
        height: 1,
        curveSegments: 12,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0
    };

    let geometry = new THREE.TextGeometry(letter, options);
    geometry.computeBoundingBox();
    let bounding = geometry.boundingBox;
    let material = new THREE.MeshBasicMaterial({
        color: 'white'
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.name = hangingThings.length + 'l';
    return {
        mesh: mesh,
        letter: letter,
        height: bounding.max.y - bounding.min.y,
        width: bounding.max.x - bounding.min.x
    };
}

function createHangingLetterPicking(hangingThing: HangingThing) {
    let stringCopied = hangingThing.string.mesh.clone();

    stringCopied.material = new THREE.MeshBasicMaterial({
        color: 1000,
        opacity: 0.0
    });
    let letter: THREE.Mesh | null = null;
    if (stringCopied.children && stringCopied.children[0] && stringCopied.children[0] instanceof THREE.Mesh) {
        letter = stringCopied.children[0] as THREE.Mesh;
        letter.material = new THREE.MeshBasicMaterial({
            color: hangingThing.id,
            opacity: 0.0
        });
    }

    let hangingLetter = hangingThing.letter;
    if (hangingLetter && letter) {
        hangingLetter.mesh = letter;
    }

    hangingThing.pickedString = {
        mesh: stringCopied,
        height: hangingThing.string.height,
        currentY: 0,
        y: hangingThing.string.y,
        down: true,
        moveLeft: true,
        currentX: 0,
        x: 0
    };
    hangingThing.pickedLetter = hangingLetter
}

function setHangingLetterPosition(hangingLetter: HangingLetter, stringHeight: number) {
    let letter = hangingLetter.letter;
    var x = -hangingLetter.width / 2;
    var y = -stringHeight / 2 - hangingLetter.height;
    var z = 0;
    switch (letter) {
        case 'b':
        case 'd':
        case 'g':
        case 'h':
        case 'j':
        case 'k':
        case 'p':
        case 'q':
        case 'x':
        case 'Q':
        case 'X':
            y += hangingLetter.height / 4;
            break;
        case 'u':
        case 'y':
        case 'U':
        case 'V':
            y += hangingLetter.height;
            break;
        case 'H':
        case 'v':
        case 'M':
        case 'N':
        case 'Y':
            y += hangingLetter.height / 2;
            break;
        case 'J':
            x -= hangingLetter.width / 4;
            break;
        case 'L':
            x += hangingLetter.width / 3;
            break;
    }
    hangingLetter.mesh.position.set(x, y, z);
}

function createHangingThing(letter: string) {
    let hangingLetter = createHangingLetter(letter);
    if (!hangingLetter) {
        return;
    }


    let string = createHangingString();
    let thing: HangingThing = {string: string, letter: hangingLetter, id: hangingThings.length};
    setHangingLetterPosition(hangingLetter, string.height);
    string.mesh.add(hangingLetter.mesh);
    scene.add(string.mesh);

    createHangingLetterPicking(thing);
    if (thing.pickedString) {
        pickingScene.add(thing.pickedString.mesh);
    }

    hangingThings.push(thing);
    addLetterSound.play();
    updateHangingPositions();
}

function rad(degrees: number): number {
    return degrees * Math.PI / 180;
}

function renderScene(time: number) {
    time *= 0.001;

    for (let i = 0; i < snowflakes.length; i++) {
        let snowflake = snowflakes[i];
        snowflake.mesh.position.x += snowflake.velocity.x;
        snowflake.mesh.position.y -= snowflake.velocity.y;
        // console.log(snowflake.mesh.position.y)
        if (snowflake.mesh.position.y < -100) {
            snowflake.mesh.position.y += 200;
        }
        if (snowflake.mesh.position.x > 1000) {
            snowflake.mesh.position.x -= 2000;
        } else if (snowflake.mesh.position.x < -1000) {
            snowflake.mesh.position.x += 2000;
        }

    }


    for (let index = 0; index < hangingThings.length; index++) {
        let thing = hangingThings[index];

        //Rotation
        if (thing && thing.letter && thing.rotation) {
            if (!thing.rotation.startTime) {
                thing.rotation.startTime = time;
            }
            let passedTime = time - thing.rotation.startTime;
            let rotate = thing.rotation.speed * passedTime + .5 * thing.rotation.decelerate * passedTime * passedTime;
            thing.rotation.currentRotation += rotate;
            if (rotate >= thing.rotation.totalRotation) {
                thing.rotation = undefined;
                thing.string.mesh.rotation.y = 0;
            } else {
                thing.string.mesh.rotation.y = rad(rotate);
            }
        }

        //Swing
        if (thing) {
            if (!thing.swingStartTime) {
                thing.swingStartTime = time;
            }
            let div = 100;
            if (thing.rotation) {
                div = 10;
            }
            let passedTime = time - thing.swingStartTime;
            let move = Math.sin(passedTime) / div;
            if (move > .01) {
                move = .01;
            } else if (move < -.01) {
                move = -.01
            }

            thing.string.mesh.position.x += move;
            if (thing.pickedString) {
                thing.pickedString.mesh.position.x += move;
            }
        }

        //Drop Down
        if (thing) {
            if (thing.string.down) {
                if (thing.string.currentY > thing.string.y) {
                    thing.string.mesh.position.y = thing.string.currentY;
                    thing.string.currentY -= 1;
                } else {
                    thing.string.mesh.position.y = thing.string.y;
                }
                if (thing.pickedString) {
                    if (thing.pickedString.currentY > thing.pickedString.y) {
                        thing.pickedString.mesh.position.y = thing.pickedString.currentY;
                        thing.pickedString.currentY -= 1;
                    } else {
                        thing.pickedString.mesh.position.y = thing.pickedString.y;
                    }
                }
            } else {
                // if (thing.string.currentY < thing.string.y) {
                //     thing.string.mesh.position.y = thing.string.currentY;
                //     thing.string.currentY += 1;
                // } else {
                //     scene.remove(thing.string.mesh);
                //     droppingThings = droppingThings.filter(t => t !== thing);
                //     // updateHangingPositions();
                // }
                // if (thing.pickedString) {
                //     if (thing.pickedString.currentY < thing.pickedString.y) {
                //         thing.pickedString.mesh.position.y = thing.pickedString.currentY;
                //         thing.pickedString.currentY += 1;
                //     } else {
                //         pickingScene.remove(thing.pickedString.mesh);
                //     }
                // }
            }

            // if (thing.string.moveLeft != null) {
            //     if (thing.string.moveLeft) {
            //         if (thing.string.currentX > thing.string.x) {
            //             thing.string.mesh.position.x = thing.string.currentX;
            //             thing.string.currentX -= 1;
            //         } else {
            //             thing.string.mesh.position.x = thing.string.x;
            //             thing.string.moveLeft = null;
            //         }
            //         if (thing.pickedString) {
            //             if (thing.pickedString.currentX > thing.pickedString.x) {
            //                 thing.pickedString.mesh.position.x = thing.pickedString.currentX;
            //                 thing.pickedString.currentX -= 1;
            //             } else {
            //                 thing.pickedString.mesh.position.x = thing.pickedString.x;
            //                 thing.pickedString.moveLeft = null;
            //             }
            //         }
            //     } else {
            //         if (thing.string.currentX < thing.string.x) {
            //             thing.string.mesh.position.x = thing.string.currentX;
            //             thing.string.currentX += 1;
            //         } else {
            //             thing.string.mesh.position.x = thing.string.x;
            //             thing.string.moveLeft = null;
            //         }
            //         if (thing.pickedString) {
            //             if (thing.pickedString.currentX < thing.pickedString.x) {
            //                 thing.pickedString.mesh.position.x = thing.pickedString.currentX;
            //                 thing.pickedString.currentX += 1;
            //             } else {
            //                 thing.pickedString.mesh.position.x = thing.pickedString.x;
            //                 thing.pickedString.moveLeft = null;
            //             }
            //         }
            //     }
            // }
        }
    }

    droppingThings.forEach(thing => {
        if (thing.string.currentY < thing.string.y) {
            thing.string.mesh.position.y = thing.string.currentY;
            thing.string.currentY += 1;
        } else {
            scene.remove(thing.string.mesh);
            droppingThings = droppingThings.filter(t => t !== thing);
            // updateHangingPositions();
        }
        if (thing.pickedString) {
            if (thing.pickedString.currentY < thing.pickedString.y) {
                thing.pickedString.mesh.position.y = thing.pickedString.currentY;
                thing.pickedString.currentY += 1;
            } else {
                pickingScene.remove(thing.pickedString.mesh);
            }
        }
    });

    requestAnimationFrame(renderScene);
    renderer.render(scene, camera);
}

class GPUPickHelper {
    // create a 1x1 pixel render target
    pickingTexture: THREE.WebGLRenderTarget;
    pixelBuffer: Uint8Array;

    constructor() {
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
        this.pixelBuffer = new Uint8Array(4);
    }

    pick(cssPosition: THREE.Vec2): HangingThing | null {
        const {pickingTexture, pixelBuffer} = this;

        // set the view offset to represent just a single pixel under the mouse
        const pixelRatio = renderer.getPixelRatio();
        camera.setViewOffset(
            renderer.getContext().drawingBufferWidth,   // full width
            renderer.getContext().drawingBufferHeight,  // full top
            cssPosition.x * pixelRatio | 0,             // rect x
            cssPosition.y * pixelRatio | 0,             // rect y
            1,                                          // rect width
            1,                                          // rect height
        );
        // render the scene
        renderer.setRenderTarget(pickingTexture);
        renderer.render(pickingScene, camera);
        renderer.setRenderTarget(null);

        // clear the view offset so rendering returns to normal
        camera.clearViewOffset();
        //read the pixel
        renderer.readRenderTargetPixels(
            pickingTexture,
            0,   // x
            0,   // y
            1,   // width
            1,   // height
            pixelBuffer);

        const id =
            (pixelBuffer[0] << 16) |
            (pixelBuffer[1] << 8) |
            (pixelBuffer[2]);

        return hangingThings[id];
    }

}

const GPUPickerHelper: GPUPickHelper = new GPUPickHelper();
requestAnimationFrame(renderScene);