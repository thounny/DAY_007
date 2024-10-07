let renderer, camera, finalQuad;
let bufferA, bufferB, bufferC, bufferD, imageBuffer;
let mousePosition = new THREE.Vector4();
let isMouseDown = false;
let frame = 0;

const RESOLUTION_SCALE = 2;

let bufferAShader, bufferBShader, imageShader;

Promise.all([
  fetch("shaders/bufferA.glsl").then((response) => response.text()),
  fetch("shaders/bufferB.glsl").then((response) => response.text()),
  fetch("shaders/imageShader.glsl").then((response) => response.text()),
]).then(([bufferA, bufferB, final]) => {
  bufferAShader = bufferA;
  bufferBShader = bufferB;
  imageShader = final;
  init();
  animate();
});

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const size = new THREE.Vector2(
    Math.round(window.innerWidth * RESOLUTION_SCALE),
    Math.round(window.innerHeight * RESOLUTION_SCALE)
  );

  bufferA = createDoubleBuffer(size, bufferAShader);
  bufferB = createDoubleBuffer(size, bufferBShader);
  bufferC = createDoubleBuffer(size, bufferBShader);
  bufferD = createDoubleBuffer(size, bufferBShader);
  imageBuffer = createBuffer(size, imageShader);

  const finalScene = new THREE.Scene();
  const finalMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
          gl_FragColor = texture2D(tDiffuse, vUv);
      }
  `,
  });
  finalQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMaterial);
  finalScene.add(finalQuad);

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mousedown", () => {
    isMouseDown = true;
    mousePosition.setZ(1);
  });
  window.addEventListener("mouseup", () => {
    isMouseDown = false;
    mousePosition.setZ(0);
  });
  window.addEventListener("resize", onWindowResize);
}

function createDoubleBuffer(size, fragmentShader) {
  return {
    read: createBuffer(size, fragmentShader),
    write: createBuffer(size, fragmentShader),
    swap() {
      [this.read, this.write] = [this.write, this.read];
    },
  };
}

function createBuffer(size, fragmentShader) {
  const scene = new THREE.Scene();
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      iChannel0: { value: null },
      iChannel1: { value: null },
      iChannel2: { value: null },
      iResolution: { value: size },
      iMouse: { value: mousePosition },
      iTime: { value: 0 },
      iFrame: { value: 0 },
    },
    fragmentShader: fragmentShader,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);
  return { scene, target, material };
}

function onMouseMove(event) {
  mousePosition.setX(event.clientX * RESOLUTION_SCALE);
  mousePosition.setY((window.innerHeight - event.clientY) * RESOLUTION_SCALE);
}

function onWindowResize() {
  const width = Math.round(window.innerWidth * RESOLUTION_SCALE);
  const height = Math.round(window.innerHeight * RESOLUTION_SCALE);
  const size = new THREE.Vector2(width, height);

  renderer.setSize(window.innerWidth, window.innerHeight);

  function resizeDoubleBuffer(buffer) {
    buffer.read.target.setSize(width, height);
    buffer.write.target.setSize(width, height);
    buffer.read.material.uniforms.iResolution.value.copy(size);
    buffer.write.material.uniforms.iResolution.value.copy(size);
  }

  resizeDoubleBuffer(bufferA);
  resizeDoubleBuffer(bufferB);
  resizeDoubleBuffer(bufferC);
  resizeDoubleBuffer(bufferD);

  imageBuffer.target.setSize(width, height);
  imageBuffer.material.uniforms.iResolution.value.copy(size);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;
  frame++;

  bufferA.write.material.uniforms.iChannel0.value = bufferA.read.target.texture;
  bufferA.write.material.uniforms.iChannel1.value = bufferB.read.target.texture;
  bufferA.write.material.uniforms.iTime.value = time;
  bufferA.write.material.uniforms.iFrame.value = frame;
  renderer.setRenderTarget(bufferA.write.target);
  renderer.render(bufferA.write.scene, camera);

  bufferB.write.material.uniforms.iChannel0.value =
    bufferA.write.target.texture;
  bufferB.write.material.uniforms.iChannel1.value = bufferB.read.target.texture;
  renderer.setRenderTarget(bufferB.write.target);
  renderer.render(bufferB.write.scene, camera);

  bufferC.write.material.uniforms.iChannel0.value =
    bufferA.write.target.texture;
  bufferC.write.material.uniforms.iChannel1.value = bufferC.read.target.texture;
  renderer.setRenderTarget(bufferC.write.target);
  renderer.render(bufferC.write.scene, camera);

  bufferD.write.material.uniforms.iChannel0.value =
    bufferA.write.target.texture;
  bufferD.write.material.uniforms.iChannel1.value = bufferD.read.target.texture;
  renderer.setRenderTarget(bufferD.write.target);
  renderer.render(bufferD.write.scene, camera);

  imageBuffer.material.uniforms.iChannel0.value = bufferA.write.target.texture;
  imageBuffer.material.uniforms.iChannel1.value = bufferB.write.target.texture;
  imageBuffer.material.uniforms.iChannel2.value = bufferC.write.target.texture;
  renderer.setRenderTarget(imageBuffer.target);
  renderer.render(imageBuffer.scene, camera);

  renderer.setRenderTarget(null);
  finalQuad.material.uniforms.tDiffuse.value = imageBuffer.target.texture;
  renderer.render(finalQuad.parent, camera);

  bufferA.swap();
  bufferB.swap();
  bufferC.swap();
  bufferD.swap();
}
