      #define size iResolution.xy
      #define SAMPLE(a, p, s) texture((a), (p)/s)

      float gauss(vec2 x, float r) {
          return exp(-pow(length(x)/r, 2.));
      }

      const float radius = 2.0;

      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      uniform vec2 iResolution;

      vec4 B(vec2 pos) {
          return SAMPLE(iChannel1, pos, size);
      }

      vec3 pdensity(vec2 pos) {
          vec4 particle_param = SAMPLE(iChannel0, pos, size);
          return vec3(particle_param.zw, gauss(pos - particle_param.xy, 0.7*radius));
      }

      const vec2 damp = vec2(0.000,0.01);
      const vec2 ampl = vec2(0.1,1.);

      void main() {
          vec2 pos = gl_FragCoord.xy;
          vec4 prev_u = SAMPLE(iChannel1, pos, size);
          vec3 density = pdensity(pos);
          vec4 u;
          u.xyz = 0.5*density;
          float div = B(pos+vec2(1,0)).x-B(pos-vec2(1,0)).x+B(pos+vec2(0,1)).y-B(pos-vec2(0,1)).y;
          u.zw = (1.-0.001)*0.25*(B(pos+vec2(0,1))+B(pos+vec2(1,0))+B(pos-vec2(0,1))+B(pos-vec2(1,0))).zw;
          u.zw += ampl*vec2(div,density.z);
          gl_FragColor = u;
      }