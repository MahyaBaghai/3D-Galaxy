import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Create scene
let sc = new THREE.Scene()

// GUI panel for parameters
let gui = new GUI({ width: 300 })

// Load star texture
let texture = new THREE.TextureLoader()
let tx = texture.load('stars/4.png')
tx.minFilter = THREE.NearestFilter

// Galaxy parameters
let parametr = {}
parametr.cnt = 6000          // number of stars
parametr.size = 0.05         // star size
parametr.radius = 1.9        // galaxy radius
parametr.branches = 5        // spiral arms
parametr.spin = 1.8          // spin factor
parametr.randomness = 0.2    // position randomness
parametr.randomnessPower = 1 // randomness distribution
parametr.insideColor = '#ed7ec4'
parametr.outsideColor = '#d1f22c'

// Galaxy objects
let stars = null
let starsMaterial = null
let starsPoints = null

// Function to generate galaxy
let galaxy = () => {
    // Remove old galaxy if exists
    if (starsPoints != null) {
        stars.dispose()
        starsMaterial.dispose()
        sc.remove(starsPoints)
    }

    // Geometry for stars
    stars = new THREE.BufferGeometry()
    let starsPosition = new Float32Array(parametr.cnt * 3)
    let color = new Float32Array(parametr.cnt * 3)

    let insideColor = new THREE.Color(parametr.insideColor)
    let outsideColor = new THREE.Color(parametr.outsideColor)

    // Generate each star
    for (let i = 0; i < parametr.cnt; ++i) {
        let i3 = i * 3

        // Spiral position
        let radius = Math.random() * parametr.radius
        let branches = (i % parametr.branches) / parametr.branches * Math.PI * 2
        let spin = parametr.spin * radius

        // Random offsets
        let x = Math.pow(Math.random(), parametr.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametr.randomness * radius
        let y = Math.pow(Math.random(), parametr.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametr.randomness * radius
        let z = Math.pow(Math.random(), parametr.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametr.randomness * radius

        starsPosition[i3 + 0] = radius * Math.cos(branches + spin) + x
        starsPosition[i3 + 1] = y
        starsPosition[i3 + 2] = radius * Math.sin(branches + spin) + z

        // Color interpolation (center → edge)
        let mixer = insideColor.clone()
        mixer.lerp(outsideColor, radius / parametr.radius)

        color[i3 + 0] = mixer.r
        color[i3 + 1] = mixer.g
        color[i3 + 2] = mixer.b
    }

    // Add attributes
    stars.setAttribute('position', new THREE.BufferAttribute(starsPosition, 3))
    stars.setAttribute('color', new THREE.BufferAttribute(color, 3))

    // Material for points
    starsMaterial = new THREE.PointsMaterial({
        size: parametr.size,
        sizeAttenuation: true,
        transparent: true,
        alphaMap: tx,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    // Create Points object
    starsPoints = new THREE.Points(stars, starsMaterial)
    sc.add(starsPoints)
}

// Initial galaxy
galaxy()

// ---------------- Responsive Setup ----------------
let size = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
let camera = new THREE.PerspectiveCamera(75, size.width / size.height)
camera.position.z = 2.5
camera.position.y = 1
sc.add(camera)

// Renderer
let canvas = document.querySelector('.web')
let renderer = new THREE.WebGLRenderer({ canvas })

// Orbit controls
let orbit = new OrbitControls(camera, canvas)
orbit.enableDamping = true

// Handle resize
window.addEventListener('resize', () => {
    size.width = window.innerWidth
    size.height = window.innerHeight
    camera.aspect = size.width / size.height
    camera.updateProjectionMatrix()
    renderer.setSize(size.width, size.height)
})

renderer.setSize(size.width, size.height)

// ---------------- GUI Controls ----------------
gui.add(parametr, 'cnt', 6000, 10000, 200).name('Stars-Count').onFinishChange(galaxy)
gui.add(parametr, 'size', 0.02, 0.1, 0.001).name('Stars-Size').onFinishChange(galaxy)
gui.add(parametr, 'radius', 1, 5, 0.1).name('Galaxy-Size').onFinishChange(galaxy)
gui.add(parametr, 'branches', 3, 10, 1).name('Galaxy-Branches').onFinishChange(galaxy)
gui.add(parametr, 'spin', 1, 5, 1).name('Galaxy-Spin').onFinishChange(galaxy)
gui.add(parametr, 'randomness', 0.09, 0.5, 0.01).name('Branches-Randomness').onFinishChange(galaxy)
gui.add(parametr, 'randomnessPower', 1, 5, 0.1).name('Randomness-Power').onFinishChange(galaxy)
gui.addColor(parametr, 'insideColor').name('Inside-Color').onFinishChange(galaxy)
gui.addColor(parametr, 'outsideColor').name('Outside-Color').onFinishChange(galaxy)

// ---------------- Animation Loop ----------------
const clock = new THREE.Clock()

let animation = () => {
    const elapsTime = clock.getElapsedTime()
    starsPoints.rotation.y = elapsTime * 0.08 // slow rotation
    orbit.update()
    renderer.render(sc, camera)
    window.requestAnimationFrame(animation)
}
animation()
