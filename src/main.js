import * as THREE from 'three'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, -12, 30)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)   // lumière de base (toutes directions)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)    // lumière directionnelle (reflets)
dirLight.position.set(5, 5, 10)
scene.add(dirLight)

// Triangle (joueur) — forme 2D -> en 3D
const shape = new THREE.Shape()
shape.moveTo( 0.0,  1.0)
shape.lineTo(-0.8, -0.8)
shape.lineTo( 0.8, -0.8)
shape.closePath()

const extrudeSettings = { depth: 0.4, bevelEnabled: false }  // depth = épaisseur sur l'axe Z
const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
const material = new THREE.MeshStandardMaterial({ color: 0xff8800, metalness: 0.3, roughness: 0.4 })
const triangle = new THREE.Mesh(geometry, material)
scene.add(triangle)

// --- ENNEMIS ---
const enemies      = []
const ENEMY_SPEED  = 0.06
let   spawnTimer   = 0
const SPAWN_RATE   = 300   // un ennemi toutes les 100 frames

// Forme losange pour le diamant
const diamondShape = new THREE.Shape()
diamondShape.moveTo( 0,    1.2)
diamondShape.lineTo( 0.85, 0)
diamondShape.lineTo( 0,   -1.2)
diamondShape.lineTo(-0.85, 0)
diamondShape.closePath()

function spawnEnemy() {
    // Choisir un bord aléatoire (haut/bas/gauche/droite)
    const side  = Math.floor(Math.random() * 4)
    const bx    = 32   // limite horizontale hors champ
    const by    = 22   // limite verticale hors champ
    let x, y

    if      (side === 0) { x = (Math.random() - 0.5) * bx * 2 ; y =  by }
    else if (side === 1) { x = (Math.random() - 0.5) * bx * 2 ; y = -by }
    else if (side === 2) { x =  bx ; y = (Math.random() - 0.5) * by * 2 }
    else                 { x = -bx ; y = (Math.random() - 0.5) * by * 2 }

    const type = Math.random() < 0.5 ? 'cube' : 'diamond'
    let geo, color

    if (type === 'cube') {
        geo   = new THREE.BoxGeometry(1.5, 1.5, 1.5)
        color = 0xff2222
    } else {
        geo   = new THREE.ExtrudeGeometry(diamondShape, { depth: 0.5, bevelEnabled: false })
        color = 0x9900ff
    }

    const mat  = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.3 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, y, 0)
    scene.add(mesh)

    enemies.push({ mesh, type, hp: type === 'cube' ? 3 : 2 })
}

function updateEnemies() {
    for (const e of enemies) {
        // Vecteur vers le joueur, normalisé
        const dx   = triangle.position.x - e.mesh.position.x
        const dy   = triangle.position.y - e.mesh.position.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        e.mesh.position.x += (dx / dist) * ENEMY_SPEED
        e.mesh.position.y += (dy / dist) * ENEMY_SPEED

        // Rotation sur eux-mêmes pour l'effet menaçant
        e.mesh.rotation.z += 0.02
        e.mesh.rotation.x += 0.01
    }
}

// Missiles
const missiles = []          // tableau qui stocke tous les missiles actifs
const MISSILE_SPEED = 0.5    // vitesse de déplacement par frame
const FIRE_RATE = 15         // tirer 1 missile toutes les 20 frames
let fireTimer = 0            // compteur de frames depuis le dernier tir

function spawnMissile() {
    // Petite sphère comme missile
    const geo = new THREE.SphereGeometry(0.2, 8, 8)
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
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
            Math.abs(m.mesh.position.x) > 80 ||
            Math.abs(m.mesh.position.y) > 80
        ) {
            scene.remove(m.mesh)
            missiles.splice(i, 1)
        }
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// On lance un rayon depuis la caméra et on trouve où il coupe le plan Z=0 (le plan du jeu)
const raycaster = new THREE.Raycaster()
const ndcMouse = new THREE.Vector2()
const gamePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const mouse = new THREE.Vector3()

window.addEventListener('mousemove', (e) => {
    ndcMouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
    ndcMouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(ndcMouse, camera)

    const hit = raycaster.ray.intersectPlane(gamePlane, new THREE.Vector3())
    if (hit) { mouse.copy(hit) }
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

    spawnTimer++
    if (spawnTimer >= SPAWN_RATE) { 
        if(enemies.length <= 5){
            spawnEnemy(); spawnTimer = 0 }
        }

    updateEnemies()

    renderer.render(scene, camera)
}

animate()
