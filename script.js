// Variables globales
let isZooming = false; // Agregar esta línea después de touchStartDistance = 0;
let scene, camera, renderer, heartParticles;
let animationPhase = 0; // 0: forming heart, 1: heart formed
let formationProgress = 0;
let progressBar = document.getElementById('progressBar');
let loveMeteorElements = [];
let impactEffects = [];
let lastMeteorTime = 0;
let meteorInterval = 300;
let completionMessage = document.getElementById('completionMessage');
let instructions = document.querySelector('.instructions');
let floatingHearts = document.getElementById('floatingHearts');
let targetZoom = 40; // zoom deseado
let zoomSpeed = 0.1; // suavidad (más bajo = más lento)
// 👆 Para control táctil
let touchStartDistance = 0;
// Variable global para la rotación de las fotos
let photoRotationAngle = 0;
// Array de frases románticas
const romanticPhrases = [
    "YOUR SILENCE SPEAKS",
    "THE LIGHT YOU KEEP",
    "UNSPOKEN BEAUTY",
    "THE PLACE I SEE YOU",
    "YOUR SECRET PULSE",
    "SHADOWS OF YOU",
    "WHISPERS OF HEART",
    "BENEATH YOUR BREATH",
    "THE VEIL OF YOU",
    "OUR SILENT WORLD"
];


// 🚀 Zoom suave con la rueda del mouse (SOLO UNA VEZ)
window.addEventListener('wheel', (event) => {
    targetZoom += event.deltaY * 0.05;

    // Limitar el rango de zoom
    targetZoom = Math.min(Math.max(targetZoom, 15), 100);
});

// Variables para control de mouse
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
let mouseRotation = { x: 0, y: 0 };
let autoRotationEnabled = true;

// 🎨 Colores románticos sincronizados (se mantiene el rosado sí o sí)
const heartColors = [0xff0000, 0xadd8e6, 0xffd700, 0x00ff00, 0x0000ff, 0xffc0cb];
let currentColorIndex = 0;

// 👉 Raycaster y mouse para detectar clicks en el corazón
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// NUEVO: control más fino del arrastre para evitar rotaciones por clicks
let isPointerDown = false;
let dragStarted = false;
let pointerDownPosition = { x: 0, y: 0 };
const DRAG_THRESHOLD = 6; // px — ajusta si quieres que sea más/menos sensible

// Variables para confeti
let confettiParticles = [];

// Crear estrellas de fondo
function createStars() {
    const starsContainer = document.getElementById('stars');
    const starCount = 800;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');

        // Posición aleatoria
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;

        // Tamaño aleatorio
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        // Duración y retraso aleatorio para la animación
        const duration = Math.random() * 5 + 3;
        const delay = Math.random() * 5;
        star.style.setProperty('--duration', `${duration}s`);
        star.style.setProperty('--delay', `${delay}s`);

        starsContainer.appendChild(star);
    }
}

// Crear corazones flotantes
function createFloatingHearts() {
    const heartCount = 30;

    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.classList.add('floating-heart');
        heart.innerHTML = '❤';

        // Posición inicial aleatoria en la parte inferior
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.bottom = `-50px`;

        // Color aleatorio (tonos rosas/rojos)
        const hue = 330 + Math.random() * 20;
        heart.style.color = `hsl(${hue}, 100%, 70%)`;

        // Tamaño aleatorio
        const size = 0.8 + Math.random() * 1.5;
        heart.style.fontSize = `${size}rem`;

        // Animación
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 15;
        heart.style.animation = `floatHeart ${duration}s linear infinite`;
        heart.style.animationDelay = `${delay}s`;

        floatingHearts.appendChild(heart);
    }
}

function createLoveMeteor() {
    const loveMeteor = document.createElement('div');
    loveMeteor.classList.add('i-love-you-meteor');
    
    // Seleccionar una frase aleatoria
    const randomPhrase = romanticPhrases[Math.floor(Math.random() * romanticPhrases.length)];
    loveMeteor.textContent = randomPhrase;

    // Resto del código igual...
    const startX = Math.random() * window.innerWidth;
    loveMeteor.style.left = `${startX}px`;
    loveMeteor.style.top = `-50px`;

    const size = 1 + Math.random() * 0.5;
    loveMeteor.style.fontSize = `${size}rem`;

    const hue = 330 + Math.random() * 20;
    loveMeteor.style.color = `hsl(${hue}, 100%, 70%)`;

    const duration = 1 + Math.random() * 2;
    loveMeteor.style.animation = `meteorFall ${duration}s linear forwards`;

    document.body.appendChild(loveMeteor);
    loveMeteorElements.push(loveMeteor);

    setTimeout(() => {
        createImpactEffect(startX);
    }, duration * 800);

    setTimeout(() => {
        loveMeteor.remove();
        loveMeteorElements = loveMeteorElements.filter(el => el !== loveMeteor);
    }, duration * 1000);
}

// Crear efecto de impacto
function createImpactEffect(x) {
    const impact = document.createElement('div');
    impact.classList.add('impact-effect');
    impact.style.left = `${x}px`;
    impact.style.bottom = `20px`;

    // Tamaño aleatorio
    const size = 50 + Math.random() * 50;
    impact.style.width = `${size}px`;
    impact.style.height = `${size}px`;

    // Animación
    const duration = 0.8 + Math.random() * 0.5;
    impact.style.animation = `impact ${duration}s ease-out forwards`;

    document.body.appendChild(impact);
    impactEffects.push(impact);

    // Eliminar después de la animación
    setTimeout(() => {
        impact.remove();
        impactEffects = impactEffects.filter(el => el !== impact);
    }, duration * 1000);
}

// Crear explosión de confeti
function createConfettiExplosion(x, y, forcedColor = null) {
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('confetti-particle');

        // Tipo de partícula aleatoria
        const particleType = Math.random();
        if (particleType < 0.4) {
            particle.classList.add('heart-confetti');
            particle.innerHTML = '❤';
        } else if (particleType < 0.7) {
            particle.classList.add('star-confetti');
        } else {
            particle.classList.add('circle-confetti');
        }

        // Posición inicial
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Dirección y distancia aleatoria
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const distance = 100 + Math.random() * 150;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        // Configurar variables CSS para la animación
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);

        // Duración aleatoria
        const duration = 0.8 + Math.random() * 0.7;
        particle.style.animation = `confettiExplode ${duration}s ease-out forwards`;

        // Color aleatorio para algunos tipos
        if (particleType >= 0.4) {
            if (forcedColor) {
                particle.style.backgroundColor = forcedColor;
            } else {
                const hue = 300 + Math.random() * 60;
                particle.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
            }
        }
        if (particleType < 0.4 && forcedColor) {
            particle.style.color = forcedColor; // corazones de confeti cambian también
        }

        document.body.appendChild(particle);
        confettiParticles.push(particle);

        // Eliminar después de la animación
        setTimeout(() => {
            particle.remove();
            confettiParticles = confettiParticles.filter(p => p !== particle);
        }, duration * 1000);
    }
}

// Configurar eventos del mouse
function setupMouseControls() {
    const container = document.getElementById('container');
// 🎉 NUEVO: Event listener para clic derecho (anticlick)
container.addEventListener('contextmenu', (event) => {
    // Prevenir el menú contextual
    event.preventDefault();
    
    // Crear confeti en la posición del clic derecho
    createConfettiExplosion(event.clientX, event.clientY);
    
    return false; // Asegurar que no aparezca el menú contextual
});
    // Pointer down
    container.addEventListener('mousedown', (event) => {
        isPointerDown = true;
        dragStarted = false;
        previousMousePosition = { x: event.clientX, y: event.clientY };
        pointerDownPosition = { x: event.clientX, y: event.clientY };
        container.style.cursor = 'grab';
    });

    // Mouse move
    container.addEventListener('mousemove', (event) => {
        if (!isPointerDown) return;

        const dxTotal = event.clientX - pointerDownPosition.x;
        const dyTotal = event.clientY - pointerDownPosition.y;
        const dist = Math.sqrt(dxTotal * dxTotal + dyTotal * dyTotal);

        if (!dragStarted) {
            if (dist >= DRAG_THRESHOLD) {
                dragStarted = true;
                isDragging = true;
                autoRotationEnabled = false;
                container.style.cursor = 'grabbing';
                previousMousePosition = { x: event.clientX, y: event.clientY };
            } else {
                return;
            }
        }

        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        rotationVelocity.x = deltaMove.y * 0.01;
        rotationVelocity.y = deltaMove.x * 0.01;

        mouseRotation.x += rotationVelocity.x;
        mouseRotation.y += rotationVelocity.y;

        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    // Mouse up
    const handleMouseUp = () => {
        if (dragStarted) {
            isDragging = false;
            dragStarted = false;
            rotationVelocity = { x: 0, y: 0 };
            container.style.cursor = 'grab';
        } else {
            isDragging = false;
            dragStarted = false;
            rotationVelocity = { x: 0, y: 0 };
            autoRotationEnabled = true;
            container.style.cursor = 'grab';
        }
        isPointerDown = false;
    };

    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevenir selección de texto
    container.addEventListener('selectstart', (e) => e.preventDefault());

    // 👉 Click en corazón o fondo
    container.addEventListener('click', (event) => {
        if (!isDragging && !dragStarted) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObject(heartParticles);

            if (intersects.length > 0) {
                currentColorIndex = (currentColorIndex + 1) % heartColors.length;
                const newColor = new THREE.Color(heartColors[currentColorIndex]);

                const colors = heartParticles.geometry.attributes.color.array;
                for (let i = 0; i < colors.length; i += 3) {
                    colors[i] = newColor.r;
                    colors[i + 1] = newColor.g;
                    colors[i + 2] = newColor.b;
                }
                heartParticles.geometry.attributes.color.needsUpdate = true;

                createConfettiExplosion(event.clientX, event.clientY, newColor.getStyle());
            } else {
                createConfettiExplosion(event.clientX, event.clientY);
            }
        }
    });
}

// Inicializar Three.js
function initThreeJS() {
    setupMouseControls();
    setupTouchControls();

    // Crear escena
    scene = new THREE.Scene();
    scene.background = null;

    // Crear cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    // Crear renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);

    // Crear partículas del corazón
    createHeartParticles();
    createPhotoPlanes(); // 🚀 fotos girando

    // Agregar luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff2a6d, 1.8, 100);
    pointLight.position.set(15, 15, 15);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffb6c1, 1.2, 100);
    pointLight2.position.set(-15, -15, 15);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xd40078, 1.0, 100);
    pointLight3.position.set(0, 0, 20);
    scene.add(pointLight3);

    // Configurar eventos
    window.addEventListener('resize', onWindowResize);

    // Iniciar animación
    animate();
}


// 🚀 Crear fotos en 3D alrededor del corazón
let photoPlanes = [];

function createPhotoPlanes() {
    const loader = new THREE.TextureLoader();

const photoURLs = [
    "img/foto1.jpeg",
    "img/foto2.jpeg",
    "img/foto3.jpeg",
    "img/foto4.jpeg",
    "img/foto5.jpeg"
];


    photoURLs.forEach((url, i) => {
        loader.load(url, (texture) => {
            const geometry = new THREE.PlaneGeometry(5, 5);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const plane = new THREE.Mesh(geometry, material);

            // Posición inicial en círculo
            const angle = (i / photoURLs.length) * Math.PI * 2;
            plane.position.set(
                Math.cos(angle) * 20,
                Math.sin(angle) * 20,
                0
            );

            scene.add(plane);
            photoPlanes.push(plane);
        });
    });
}

function setupTouchControls() {
    const container = document.getElementById('container');
    let lastTouchX = 0;
    let lastTouchY = 0;

    container.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            lastTouchX = event.touches[0].clientX;
            lastTouchY = event.touches[0].clientY;
            isDragging = true;
            autoRotationEnabled = false;
            isZooming = false;
        } else if (event.touches.length === 2) {
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            isDragging = false;
            isZooming = true;
        }
    });

    container.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1 && isDragging && !isZooming) {
            const deltaX = event.touches[0].clientX - lastTouchX;
            const deltaY = event.touches[0].clientY - lastTouchY;

            rotationVelocity.x = deltaY * 0.01;
            rotationVelocity.y = deltaX * 0.01;

            mouseRotation.x += rotationVelocity.x;
            mouseRotation.y += rotationVelocity.y;

            lastTouchX = event.touches[0].clientX;
            lastTouchY = event.touches[0].clientY;
        } else if (event.touches.length === 2 && isZooming) {
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (touchStartDistance > 0) {
                const zoomDelta = (touchStartDistance - distance) * 0.05;
                targetZoom += zoomDelta;
                targetZoom = Math.min(Math.max(targetZoom, 15), 100);
            }
            touchStartDistance = distance;
        }
    });

    container.addEventListener('touchend', (event) => {
        if (event.touches.length === 0) {
            isDragging = false;
            isZooming = false;
            autoRotationEnabled = true;
            touchStartDistance = 0;
        } else if (event.touches.length === 1) {
            isZooming = false;
            isDragging = true;
            autoRotationEnabled = false;
            lastTouchX = event.touches[0].clientX;
            lastTouchY = event.touches[0].clientY;
        }
    });
}

// Función para generar posición de corazón (orientación corregida)
function heartPosition(t, scale) {
    // Ajustar t para que cubra todo el corazón
    t = t * Math.PI * 2;

    // Ecuación paramétrica del corazón - orientación correcta
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (Math.random() - 0.5) * 4;

    return new THREE.Vector3(x * scale, y * scale, z * scale);
}

function createHeartParticles() {
    // Crear geometría para las partículas
    const particleCount = 6000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const startPositions = new Float32Array(particleCount * 3);
    const targetPositions = new Float32Array(particleCount * 3);

    // Calcular posiciones objetivo (forma de corazón)
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const scale = 0.9 + Math.random() * 0.5;

        // Posición objetivo en forma de corazón
        const heartPos = heartPosition(i / particleCount, scale);

        targetPositions[i3] = heartPos.x;
        targetPositions[i3 + 1] = heartPos.y;
        targetPositions[i3 + 2] = heartPos.z;

        // Posición inicial aleatoria en un cubo grande
        const spread = 140;
        startPositions[i3] = (Math.random() - 0.5) * spread;
        startPositions[i3 + 1] = (Math.random() - 0.5) * spread;
        startPositions[i3 + 2] = (Math.random() - 0.5) * spread;

        // Posición actual = posición inicial
        positions[i3] = startPositions[i3];
        positions[i3 + 1] = startPositions[i3 + 1];
        positions[i3 + 2] = startPositions[i3 + 2];

                // Colores (tonos rosas más vibrantes)
        colors[i3] = 0.95 + Math.random() * 0.05;     // R
        colors[i3 + 1] = 0.2 + Math.random() * 0.2;  // G
        colors[i3 + 2] = 0.4 + Math.random() * 0.2;  // B

        // Tamaños más pequeños para mejor definición
        sizes[i] = Math.random() * 0.4 + 0.1;
    }

    // Crear geometría de búfer
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Guardar las posiciones
    geometry.startPositions = startPositions;
    geometry.targetPositions = targetPositions;

    // Material de puntos (partículas más pequeñas)
    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    // Crear sistema de partículas
    heartParticles = new THREE.Points(geometry, material);
    scene.add(heartParticles);

    // Posicionar el corazón
    heartParticles.position.y = 0;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Crear meteoritos periódicamente
    const now = Date.now();
    if (now - lastMeteorTime > meteorInterval) {
        createLoveMeteor();
        lastMeteorTime = now;

        // Variar el intervalo para hacerlo más natural
        meteorInterval = 150 + Math.random() * 250;
    }

    // Fase 0: Formando el corazón
    if (animationPhase === 0) {
        formationProgress = Math.min(1, formationProgress + 0.003);
        progressBar.style.width = `${formationProgress * 100}%`;

        const positions = heartParticles.geometry.attributes.position.array;
        const startPositions = heartParticles.geometry.startPositions;
        const targetPositions = heartParticles.geometry.targetPositions;

        for (let i = 0; i < positions.length; i += 3) {
            // Calcular posición intermedia
            positions[i] = startPositions[i] + (targetPositions[i] - startPositions[i]) * formationProgress;
            positions[i + 1] = startPositions[i + 1] + (targetPositions[i + 1] - startPositions[i + 1]) * formationProgress;
            positions[i + 2] = startPositions[i + 2] + (targetPositions[i + 2] - startPositions[i + 2]) * formationProgress;
        }

        heartParticles.geometry.attributes.position.needsUpdate = true;

        // Cuando se completa la formación
        if (formationProgress >= 1) {
            animationPhase = 1;

            // Mostrar mensaje de completado
            completionMessage.style.opacity = "1";
            completionMessage.style.transform = "translateY(0)";
            completionMessage.textContent = "";

            // Actualizar instrucciones
            instructions.textContent = "";

            // Ocultar barra de progreso después de un tiempo
            setTimeout(() => {
                document.querySelector('.progress-container').style.opacity = "0";
            }, 1500);
        }
    }
    // Fase 1: Corazón formado
    else if (animationPhase === 1) {
        // Hacer que las partículas "respiren"
        const time = Date.now() * 0.001;
        const positions = heartParticles.geometry.attributes.position.array;
        const targetPositions = heartParticles.geometry.targetPositions;

        for (let i = 0; i < positions.length; i += 3) {
            const originalX = targetPositions[i];
            const originalY = targetPositions[i + 1];
            const originalZ = targetPositions[i + 2];

            const distance = Math.sqrt(originalX * originalX + originalY * originalY + originalZ * originalZ);
            const pulse = Math.sin(time * 0.5 + distance * 0.1) * 0.18 + 1;

            positions[i] = originalX * pulse;
            positions[i + 1] = originalY * pulse;
            positions[i + 2] = originalZ * pulse;
        }

        heartParticles.geometry.attributes.position.needsUpdate = true;

        // Rotación automática o con el mouse
        if (autoRotationEnabled) {
            heartParticles.rotation.y += 0.005;
            heartParticles.rotation.x = Math.sin(time * 0.3) * 0.1;
        } else {
            heartParticles.rotation.x = mouseRotation.x;
            heartParticles.rotation.y = mouseRotation.y;

            // Inercia
            rotationVelocity.x *= 0.95;
            rotationVelocity.y *= 0.95;

            mouseRotation.x += rotationVelocity.x;
            mouseRotation.y += rotationVelocity.y;
        }

        // Desvanecer mensaje
        if (parseFloat(completionMessage.style.opacity) > 0) {
            completionMessage.style.opacity = parseFloat(completionMessage.style.opacity) - 0.005;
        }
    }
    // 🚀 Animación de las fotos alrededor del corazón
    if (photoPlanes.length > 0) {
        photoRotationAngle += 0.005; // velocidad de giro
        const radius = 20; // radio del círculo

        photoPlanes.forEach((plane, i) => {
            const angle = photoRotationAngle + (i / photoPlanes.length) * Math.PI * 2;
            plane.position.x = Math.cos(angle) * radius;
            plane.position.y = Math.sin(angle) * radius;
            plane.lookAt(0, 0, 0); // que miren siempre al corazón
        });
    }

    // 🚀 Animación de zoom suave (siempre al final del loop)
    camera.position.z += (targetZoom - camera.position.z) * zoomSpeed;

    // Render
    renderer.render(scene, camera);
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function () {
    createStars();
    createFloatingHearts();
    initThreeJS();

    // Comenzar con algunos meteoritos
    for (let i = 0; i < 8; i++) {
        setTimeout(() => createLoveMeteor(), i * 300);
    }
});
// 🎶 Control del reproductor
const playPauseBtn = document.getElementById("playPauseBtn");
const bgMusic = document.getElementById("bgMusic");
const volumeControl = document.getElementById("volumeControl");

let isPlaying = false;

playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
        bgMusic.pause();
        playPauseBtn.textContent = "▶"; // cambia a play
    } else {
        bgMusic.play();
        playPauseBtn.textContent = "⏸"; // cambia a pausa
    }
    isPlaying = !isPlaying;
});

// control de volumen
volumeControl.addEventListener("input", () => {
    bgMusic.volume = volumeControl.value;
});

// Variables para la propuesta
const proposalBtn = document.getElementById('proposalBtn');
const proposalModal = document.getElementById('proposalModal');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const sadMessage = document.getElementById('sadMessage');
const celebrationMessage = document.getElementById('celebrationMessage');

// Frases profundas si dice “No”
const sadMessages = [
    "Even absence speaks.",
    "Your silence lingers.",
    "The heart chooses alone.",
    "Shadows remain, even apart.",
    "The soul mourns quietly.",
    "Some truths can't be held.",
    "Distance whispers."
];

// Frases profundas si dice “Sí”
const celebrationWords = [
    "The world bows to you.",
    "Light blooms within.",
    "Souls recognize each other.",
    "Time pauses for us.",
    "Your being awakens me.",
    "Infinity feels near.",
    "All converges in you."
];

let sadMessageIndex = 0;
let noButtonClicks = 0;

// Abrir modal de propuesta
proposalBtn.addEventListener('click', () => {
    proposalModal.style.display = 'flex';
    createConfettiExplosion(window.innerWidth / 2, window.innerHeight / 2);
});

// Función para explotar el corazón
function explodeHeart() {
    const positions = heartParticles.geometry.attributes.position.array;
    const targetPositions = heartParticles.geometry.targetPositions;
    
    for (let i = 0; i < positions.length; i += 3) {
        // Crear explosión radial
        const explosionForce = 50 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        
        positions[i] = targetPositions[i] + Math.cos(angle) * Math.cos(elevation) * explosionForce;
        positions[i + 1] = targetPositions[i + 1] + Math.sin(elevation) * explosionForce;
        positions[i + 2] = targetPositions[i + 2] + Math.sin(angle) * Math.cos(elevation) * explosionForce;
    }
    
    heartParticles.geometry.attributes.position.needsUpdate = true;
}

// Función para reconstruir el corazón
function reconstructHeart() {
    const positions = heartParticles.geometry.attributes.position.array;
    const targetPositions = heartParticles.geometry.targetPositions;
    let progress = 0;
    
    const reconstructAnimation = () => {
        progress += 0.02;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Interpolación suave hacia la posición original
            positions[i] += (targetPositions[i] - positions[i]) * 0.05;
            positions[i + 1] += (targetPositions[i + 1] - positions[i + 1]) * 0.05;
            positions[i + 2] += (targetPositions[i + 2] - positions[i + 2]) * 0.05;
        }
        
        heartParticles.geometry.attributes.position.needsUpdate = true;
        
        if (progress < 1) {
            requestAnimationFrame(reconstructAnimation);
        }
    };
    
    reconstructAnimation();
}

// Función para mostrar palabras flotantes
function showFloatingWords() {
    for (let i = 0; i < celebrationWords.length; i++) {
        setTimeout(() => {
            const word = document.createElement('div');
            word.textContent = celebrationWords[i];
            word.style.cssText = `
                position: fixed;
                font-size: 2.5rem;
                font-weight: bold;
                color: #ff2a6d;
                text-shadow: 0 0 20px rgba(255, 42, 109, 0.8);
                z-index: 7000;
                pointer-events: none;
                font-family: 'Arial Black', sans-serif;
                letter-spacing: 2px;
                left: ${Math.random() * (window.innerWidth - 300)}px;
                top: ${Math.random() * (window.innerHeight - 100)}px;
                opacity: 0;
                transform: scale(0);
                animation: wordAppear 3s ease-out forwards;
            `;
            
            document.body.appendChild(word);
            
            setTimeout(() => word.remove(), 3000);
        }, i * 500);
    }
}

// Botón YES
yesBtn.addEventListener('click', () => {
    proposalModal.style.display = 'none';
    
    // 1. Explotar el corazón
    explodeHeart();
    
    // 2. Mostrar palabras flotantes
    setTimeout(() => {
        showFloatingWords();
    }, 500);
    
    // 3. Explosión masiva de confeti
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            createConfettiExplosion(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                '#ff2a6d'
            );
        }, i * 150);
    }
    
    // 4. Reconstruir el corazón
    setTimeout(() => {
        reconstructHeart();
    }, 2000);
    
    // 5. Mostrar mensaje de celebración
    setTimeout(() => {
        celebrationMessage.style.display = 'flex';
    }, 3000);
});

// Botón NO (travesura)
noBtn.addEventListener('mouseenter', () => {
    noButtonClicks++;
    
    sadMessage.textContent = sadMessages[sadMessageIndex];
    sadMessageIndex = (sadMessageIndex + 1) % sadMessages.length;
    
    const maxX = 250;
    const maxY = 120;
    const randomX = (Math.random() - 0.5) * maxX;
    const randomY = (Math.random() - 0.5) * maxY;
    
    noBtn.style.transform = `translate(${randomX}px, ${randomY}px) scale(${0.8 + Math.random() * 0.4}) rotate(${Math.random() * 20 - 10}deg)`;
    
    const newScale = Math.max(0.3, 1 - (noButtonClicks * 0.08));
    noBtn.style.transform += ` scale(${newScale})`;
    
    if (noButtonClicks > 5) {
        noBtn.textContent = "Please... 🥺";
    }
    if (noButtonClicks > 10) {
        noBtn.textContent = "Don't click me 😭";
    }
    if (noButtonClicks > 15) {
        noBtn.style.display = 'none';
        sadMessage.textContent = "Even refusal can resonate with beauty and grace.";
    }
});

noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    createConfettiExplosion(e.clientX, e.clientY, '#ff0000');
    
    const extraSadMessages = [
        "That hurt... 💔",
        "Why would you do that? 😢",
        "I'm not giving up on us! 💪"
    ];
    
    sadMessage.textContent = extraSadMessages[Math.floor(Math.random() * extraSadMessages.length)];
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        proposalModal.style.display = 'none';
        celebrationMessage.style.display = 'none';
    }
});

// Botón para cerrar celebración
document.querySelector('.close-celebration').addEventListener('click', function() {
    document.getElementById('celebrationMessage').style.display = 'none';
});

