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

// Triangle
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

    const minDist = 4
    const dx = triangle.position.x - mouse.x
    const dy = triangle.position.y - mouse.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const targetX = mouse.x + (dx / dist) * minDist
    const targetY = mouse.y + (dy / dist) * minDist

    triangle.position.x += (targetX - triangle.position.x) * 0.05
    triangle.position.y += (targetY - triangle.position.y) * 0.05

    const rx = mouse.x - triangle.position.x
    const ry = mouse.y - triangle.position.y
    triangle.rotation.z = Math.atan2(-rx, ry)

    renderer.render(scene, camera)
}

animate()
