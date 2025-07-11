import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CharacterController } from './maController.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.panSpeed = 2;
controls.rotateSpeed = 2;
controls.keys = {
  LEFT: 'KeyA',
  UP: 'KeyW',
  RIGHT: 'KeyD',
  BOTTOM: 'KeyS'
};
controls.listenToKeyEvents(window);
controls.keyPanSpeed = 20;
camera.position.set(0, 6, 6);
controls.update();

let modelLoaded = false;
let floorLoaded = false;
let skyboxLoaded = false;

function tryStart() {
  if (modelLoaded && floorLoaded && skyboxLoaded) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
    criarPersonagens();
    animate();
  }
}

const loadingManager = new THREE.LoadingManager(() => {
  skyboxLoaded = true;
  tryStart();
});

const skyboxLoader = new THREE.CubeTextureLoader(loadingManager);
const skyboxTexture = skyboxLoader.setPath('./skybox/').load([
  'skybox_left.png',
  'skybox_right.png',
  'skybox_up.png',
  'skybox_down.png',
  'skybox_front.png',
  'skybox_back.png'
]);
scene.background = skyboxTexture;

const textureLoader = new THREE.TextureLoader();
let floor;

textureLoader.load(
  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Grass_Texture.png",
  function (tex) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(100, 100);

    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshLambertMaterial({
      map: tex,
      side: THREE.DoubleSide
    });

    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    floorLoaded = true;
    tryStart();
  },
  undefined,
  function (err) {
    console.error(err);
  }
);

function updateFloorPosition() {
  if (floor && characterController[I]) {
    const charPos = characterController[I].model.position;
    floor.position.x = Math.round(charPos.x / 50) * 50;
    floor.position.z = Math.round(charPos.z / 50) * 50;
  }
}

const KP = {};
let I = 0;
let CC = 1;

const characterController = [];
let model;

function criarPersonagens() {
  if (CC > characterController.length) {
    const diff = CC - characterController.length;
    for (let i = 0; i < diff; i++) {
      const novo = new CharacterController(model.clone(), 0.1);
      characterController.push(novo);
      scene.add(novo.model);
    }
  }

  if (CC < characterController.length) {
    const diff = characterController.length - CC;
    for (let i = 0; i < diff; i++) {
      const ultimo = characterController.pop();
      scene.remove(ultimo.model);
    }

    if (I >= CC) {
      I = 0;
    }
  }
}

window.addEventListener('keydown', (event) => {
  KP[event.code] = true;

  if (event.code.startsWith('Digit')) {
    const index = Number(event.code.slice(-1));
    if (index < characterController.length) {
      I = index;
    }
  }

  if (event.code === 'KeyN') {
    I = (I + 1) % characterController.length;
  }

  if (event.code === 'KeyP') {
    I = (I - 1 + characterController.length) % characterController.length;
  }

  if (event.key === '+') {
    CC++;
    criarPersonagens();
  }

  if (event.key === '-' && CC > 1) {
    CC--;
    criarPersonagens();
  }
});

window.addEventListener('keyup', (event) => {
  KP[event.code] = false;
});

const loader = new GLTFLoader();
loader.load('character1.glb', function (gltf) {
  model = gltf.scene;
  modelLoaded = true;
  tryStart();
}, undefined, function (error) {
  console.error(error);
});

function animate() {
  requestAnimationFrame(animate);

  if (characterController[I]) {
    characterController[I].update(KP);
  }

  controls.update();
  updateFloorPosition();
  renderer.render(scene, camera);
}
