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

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

animate()
