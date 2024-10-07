# DAY_007 | Lava Buster Animation

This project is part of the daily code challenge series, **DAY_007**, featuring a **Lava Buster Animation** created using **Shaders** and **Three.js**. The animation simulates fluid-like molten lava with interactive, physics-based effects.

## Inspiration

Inspired by the Lava Buster Shader from Shadertoy.  
Check it out here: [Lava Buster Shader](https://www.shadertoy.com/view/WdtXzs)

---

## Shader in use

![Lava Buster Shader](./assets/DAY_007_inspo.gif)

## Visual Demo
![Visual Demo](./assets/DAY_007_demo.gif)

---

## Project Structure

```bash
DAY_007/
│
├── assets/
│   ├── DAY_007_demo.gif
│   ├── DAY_007_inspo.gif
│   └── favicon.ico
├── fonts/
│   └── helveticaneue.woff2
├── shaders/
│   ├── BufferA.glsl
│   ├── BufferB.glsl
│   └── imageShader.glsl
├── index.html
├── styles.css
└── script.js
```

---

## Features

- **Lava Simulation**: A dynamic lava-like animation created using **GLSL Shaders** and **Three.js**.
  
- **Interactive Mouse Movement**: The flow and direction of the lava change based on user mouse interactions.

- **Multiple Shader Buffers**: Buffers A and B handle the lava's movement and dynamics, while the image shader adds post-processing effects.

---

## How to Run

1. **Clone the repository**:

   ```bash
   git clone https://github.com/thounny/DAY_007.git
   ```

2. **Navigate to the project directory**:

   ```bash
   cd DAY_007
   ```

3. **Open the `index.html` file** in your web browser:

   - You can double-click the file in your file explorer, or
   - Serve it using a local development server (e.g., Live Server in VSCode).

---

## How the JavaScript Works

### Setting up the Renderer and Camera

```javascript
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
```

- **Renderer Setup**: Configures the WebGL renderer to fit the screen and have smooth edges using antialiasing.
- **Camera**: Uses an orthographic camera for 2D rendering.

### Handling Shaders and Buffers

```javascript
Promise.all([
  fetch("shaders/bufferA.glsl").then(response => response.text()),
  fetch("shaders/bufferB.glsl").then(response => response.text()),
  fetch("shaders/imageShader.glsl").then(response => response.text()),
]).then(([bufferA, bufferB, imageShader]) => {
  bufferAShader = bufferA;
  bufferBShader = bufferB;
  imageShader = final;
  init();
  animate();
});
```

- **Shader Loading**: Fetches the GLSL shader code from external `.glsl` files and stores them for rendering.

### Mouse Interaction

```javascript
window.addEventListener("mousemove", (event) => {
  mousePosition.setX(event.clientX * RESOLUTION_SCALE);
  mousePosition.setY((window.innerHeight - event.clientY) * RESOLUTION_SCALE);
});

window.addEventListener("mousedown", () => {
  isMouseDown = true;
  mousePosition.setZ(1);
});

window.addEventListener("mouseup", () => {
  isMouseDown = false;
  mousePosition.setZ(0);
});
```

- **Mouse Events**: Tracks mouse movement to update the position and interaction with the lava flow.

---

## GLSL Shader Highlights

### BufferA.glsl: Lava Particle Dynamics

```glsl
#define size iResolution.xy
#define SAMPLE(a, p, s) texture((a), (p)/s)

float gauss(vec2 x, float r) {
  return exp(-pow(length(x)/r, 2.));
}

uniform sampler2D iChannel0;
uniform vec2 iResolution;
uniform vec4 iMouse;
uniform float iTime;
uniform float iFrame;

void Check(inout vec4 U, vec2 pos, vec2 dx) {
  vec4 Unb = SAMPLE(iChannel0, pos + dx, size);
  vec2 rpos1 = mod(pos - Unb.xy + size * 0.5, size) - size * 0.5;
  if(length(rpos1) < 1.0) {
    U = Unb;
  }
}

void main() {
  vec2 pos = gl_FragCoord.xy;
  vec4 U = SAMPLE(iChannel0, pos, size);
  Check(U, pos, vec2(-1,0));
  U.xy = mod(U.xy, size);
  
  if (length(mod(pos - U.xy + size * 0.5, size) - size * 0.5) > 1.0) {
    U.xy = pos;
  }
  
  gl_FragColor = U;
}
```

- **Particle Dynamics**: This shader handles the motion of individual particles that create the flowing lava effect. It uses Gaussian distribution to control particle spread and movement based on time and position.

---

### BufferB.glsl: Fluid Density and Pressure

```glsl
#define size iResolution.xy

uniform sampler2D iChannel0;
uniform vec2 iResolution;

vec4 B(vec2 pos) {
  return texture(iChannel1, pos / size);
}

vec3 pdensity(vec2 pos) {
  vec4 particle_param = texture(iChannel0, pos / size);
  return vec3(particle_param.zw, gauss(pos - particle_param.xy, 0.7 * radius));
}

void main() {
  vec2 pos = gl_FragCoord.xy;
  vec4 prev_u = texture(iChannel1, pos / size);
  vec3 density = pdensity(pos);
  
  vec4 u = vec4(0.5 * density, 1.0);
  
  gl_FragColor = u;
}
```

- **Fluid Dynamics**: This shader calculates fluid pressure and density, affecting how the lava behaves and flows over time.

---

### imageShader.glsl: Final Post-Processing

```glsl
#define size iResolution.xy

uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform vec2 iResolution;

void main() {
  vec2 pos = gl_FragCoord.xy;
  vec3 density = pdensity(pos);
  vec4 blur = texture(iChannel1, pos / size);
  float vorticity = B(pos + vec2(1, 0)).y - B(pos - vec2(1, 0)).y;
  
  vec4 fragColor;
  fragColor = vec4(2.0 * density.z * (7.0 * abs(density.xyy) + vec3(0.2, 0.1, 0.1)), 1.0);
  fragColor = vec4(10.0 * abs(density.xyy) + 30.0 * vec3(0, 0, abs(blur.z)), 1.0);
  
  gl_FragColor = fragColor;
}
```

- **Post-Processing**: This shader blends the final output, applying effects like blurring and color manipulation to create the molten lava appearance.

---
## Technologies Used

- **HTML5**: For structuring the document.
- **CSS3**: For responsive design and layout.
- **JavaScript (ES6)**: For handling interactivity and rendering logic.
- **Three.js**: For rendering the WebGL content and managing shaders.
- **GLSL Shaders**: For creating the dynamic lava animation.

---

## Author

![Logo](https://web.archive.org/web/20091027053343im_/http://geocities.com/animecap/index_dwn.gif)

**Thounny Keo**  
Frontend Development Student | Year Up United
