import * as THREE from './node_modules/three/build/three.module.js';

import { GUI } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/libs/dat.gui.module.js';

// Charger MIDI.js et sons
MIDI.loadPlugin({
    soundfontUrl: "./midi/soundfont/",
    instrument: "acoustic_grand_piano",
    onprogress: function(state, progress) {
        console.log(state, progress);
    },
    onsuccess: function() {
        console.log("MIDI.js prêt !");
    }
});

// Création de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Lumières améliorées pour un rendu réaliste
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(0, 100, 50);
scene.add(directionalLight);

// Piano
const keys = [];
const keyNotes = [
    { note: 'C3', white: true },
    { note: 'Db3', white: false },
    { note: 'D3', white: true },
    { note: 'Eb3', white: false },
    { note: 'E3', white: true },
    { note: 'F3', white: true },
    { note: 'Gb3', white: false },
    { note: 'G3', white: true },
    { note: 'Ab3', white: false },
    { note: 'A3', white: true },
    { note: 'Bb3', white: false },
    { note: 'B3', white: true },

    { note: 'C4', white: true },
    { note: 'Db4', white: false },
    { note: 'D4', white: true },
    { note: 'Eb4', white: false },
    { note: 'E4', white: true },
    { note: 'F4', white: true },
    { note: 'Gb4', white: false },
    { note: 'G4', white: true },
    { note: 'Ab4', white: false },
    { note: 'A4', white: true },
    { note: 'Bb4', white: false },
    { note: 'B4', white: true }
];

// Fonction pour créer une touche réaliste
function createKey(x, isWhite, note) {
    const geometry = new THREE.BoxGeometry(
        isWhite ? 2 : 1.2,
        isWhite ? 1 : 1.5,
        isWhite ? 8 : 5
    );

    const material = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xffffff : 0x000000,
        metalness: 0.2,
        roughness: 0.5
    });

    const key = new THREE.Mesh(geometry, material);

    if (isWhite) {
        key.position.set(x, 0, 0);
    } else {
        key.position.set(x - 1.1, 0.25, -1.5); // Ajustement précis pour compenser l'espacement
    }

    key.userData = { note, isWhite };

    keys.push(key);
    return key;
}

// Générer les touches avec alignement parfait
const pianoGroup = new THREE.Group();
let xOffset = 0;

keyNotes.forEach(({ note, white }) => {
    const key = createKey(xOffset, white, note);
    pianoGroup.add(key);

    if (white) {
        xOffset += 2.2; // Espacement entre touches blanches
    }
});

// Centrer le piano
const totalWhiteKeys = keyNotes.filter(key => key.white).length;
pianoGroup.position.x = -(totalWhiteKeys * 2) / 2;
pianoGroup.position.y = -6;

scene.add(pianoGroup);

// Ajout du système de touches du clavier
const keyBindings = {
    'q': 'C3', 's': 'Db3', 'd': 'D3', 'f': 'Eb3', 'g': 'E3',
    'h': 'F3', 'j': 'Gb3', 'k': 'G3', 'l': 'Ab3', 'm': 'A3',
    'ù': 'Bb3', '*': 'B3', 'a': 'C4', 'z': 'Db4', 'e': 'D4',
    'r': 'Eb4', 't': 'E4', 'y': 'F4', 'u': 'Gb4', 'i': 'G4',
    'o': 'Ab4', 'p': 'A4', 'w': 'Bb4', 'x': 'B4'
};

window.addEventListener('keydown', (event) => {
    if (!event.repeat) {
        const note = keyBindings[event.key.toLowerCase()];
        if (note) {
            const selectedKey = keys.find(k => k.userData.note === note);
            if (selectedKey) {
                MIDI.noteOn(0, MIDI.keyToNote[note], 127, 0);
                selectedKey.material.emissive = new THREE.Color(0xaaaaaa);
                setTimeout(() => selectedKey.material.emissive = new THREE.Color(0x000000), 200);
            }
        }
    }
});

// Ajout d'une interface HUD pour contrôler la caméra
const gui = new GUI();
const cameraSettings = {
    x: 0,
    y: 9,
    z: 8
};

gui.add(cameraSettings, 'x', -20, 20).name("Caméra X").onChange(updateCamera);
gui.add(cameraSettings, 'y', 2, 20).name("Caméra Y").onChange(updateCamera);
gui.add(cameraSettings, 'z', 5, 30).name("Caméra Z").onChange(updateCamera);

function updateCamera() {
    camera.position.set(cameraSettings.x, cameraSettings.y, cameraSettings.z);
    camera.lookAt(0, 0, 0);
}
updateCamera(); // Position initiale

// Gestion des clics pour jouer les sons
function onDocumentMouseDown(event) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(keys);

    if (intersects.length > 0) {
        const selectedKey = intersects[0].object;
        const note = selectedKey.userData.note;

        MIDI.noteOn(0, MIDI.keyToNote[note], 127, 0);

        selectedKey.material.emissive = new THREE.Color(0xaaaaaa);
        setTimeout(() => selectedKey.material.emissive = new THREE.Color(0x000000), 200);
    }
}

window.addEventListener('mousedown', onDocumentMouseDown);

// Animation
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Redimensionnement
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
