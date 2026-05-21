import * as THREE from 'three'

const scene = new THREE.Scene()

const aspect = window.innerWidth / window.innerHeight
const zoom = 20
const camera = new THREE.OrthographicCamera(
    -zoom * aspect, zoom * aspect,
    zoom, -zoom,
    0.1, 100
)
camera.position.z = 10

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Triangle (joueur)
const geometry = new THREE.BufferGeometry()
const vertices = new Float32Array([
     0.0,  1.0, 0,
    -0.8, -0.8, 0,
     0.8, -0.8, 0,
])
geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
const material = new THREE.LineBasicMaterial({ color: 0xff8800 })
const triangle = new THREE.LineLoop(geometry, material)
scene.add(triangle)

// Missiles
const missiles = []          // tableau qui stocke tous les missiles actifs
const MISSILE_SPEED = 0.5    // vitesse de déplacement par frame
const FIRE_RATE = 15         // tirer 1 missile toutes les 20 frames
let fireTimer = 0            // compteur de frames depuis le dernier tir

function spawnMissile() {
    // Petite sphère comme missile
    const geo = new THREE.CircleGeometry(0.2, 8)
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff })
    const mesh = new THREE.Mesh(geo, mat)

    // Part de la position du triangle
    mesh.position.set(triangle.position.x, triangle.position.y, 0)

    // Direction vers la souris (vecteur normalisé)
    const rx = mouse.x - triangle.position.x
    const ry = mouse.y - triangle.position.y
    const len = Math.sqrt(rx * rx + ry * ry)

    scene.add(mesh)
    missiles.push({
        mesh,
        vx: (rx / len) * MISSILE_SPEED,  // vitesse X
        vy: (ry / len) * MISSILE_SPEED,  // vitesse Y
    })
}

function updateMissiles() {
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i]

        // Déplacer le missile
        m.mesh.position.x += m.vx
        m.mesh.position.y += m.vy

        // Supprimer si hors champ
        if (
            Math.abs(m.mesh.position.x) > zoom * 3 ||
            Math.abs(m.mesh.position.y) > zoom * 3
        ) {
            scene.remove(m.mesh)
            missiles.splice(i, 1)
        }
    }
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight
    camera.left   = -zoom * aspect
    camera.right  =  zoom * aspect
    camera.top    =  zoom
    camera.bottom = -zoom
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (e) => {
    const aspect = window.innerWidth / window.innerHeight
    mouse.x = ((e.clientX / window.innerWidth) * 2 - 1) * zoom * aspect
    mouse.y = (-(e.clientY / window.innerHeight) * 2 + 1) * zoom
})

function animate() {
    requestAnimationFrame(animate)

    // Déplacement du triangle
    const minDist = 4
    const dx = triangle.position.x - mouse.x
    const dy = triangle.position.y - mouse.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const targetX = mouse.x + (dx / dist) * minDist
    const targetY = mouse.y + (dy / dist) * minDist

    triangle.position.x += (targetX - triangle.position.x) * 0.05
    triangle.position.y += (targetY - triangle.position.y) * 0.05

    // Rotation vers la souris
    const rx = mouse.x - triangle.position.x
    const ry = mouse.y - triangle.position.y
    triangle.rotation.z = Math.atan2(-rx, ry)

    // Tir automatique
    fireTimer++
    if (fireTimer >= FIRE_RATE) {
        spawnMissile()
        fireTimer = 0
    }

    updateMissiles()

    renderer.render(scene, camera)
}

animate()
