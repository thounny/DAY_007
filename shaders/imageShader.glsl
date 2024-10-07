    #define size iResolution.xy
      #define SAMPLE(a, p, s) texture((a), (p)/s)

      float gauss(vec2 x, float r) {
          return exp(-pow(length(x)/r, 2.));
      }

      const float radius = 2.0;

      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      uniform sampler2D iChannel2;
      uniform vec2 iResolution;

      vec4 B(vec2 pos) {
          return SAMPLE(iChannel1, pos, size);
      }

      vec3 pdensity(vec2 pos) {
          vec4 particle_param = SAMPLE(iChannel0, pos, size);
          return vec3(particle_param.zw, gauss(pos - particle_param.xy, 0.7*radius));
      }

      void main() {
          vec2 pos = gl_FragCoord.xy;
          vec3 density = pdensity(pos);
          vec4 blur = SAMPLE(iChannel1, pos, size);
          float vorticity = B(pos+vec2(1,0)).y-B(pos-vec2(1,0)).y-B(pos+vec2(0,1)).x+B(pos-vec2(0,1)).x;

          vec4 fragColor;
          if(texture2D(iChannel2, vec2(38, 2) / 256.0).x > 0.5) {
              fragColor = vec4(2.*density.z*(7.*abs(density.xyy)+vec3(0.2, 0.1, 0.1)),1.0);
              fragColor = vec4(10.*abs(density.xyy) + 30.*vec3(0,0,abs(blur.z)),1.0);
          } else {
              float l1 = 490.*abs(vorticity);
              float l2 = 1.-l1;
              fragColor = vec4(vec3(1.,0.3,0.1)*l1 + 0.*vec3(0.1,0.1,0.1)*l2,1.0);
          }
          gl_FragColor = fragColor;
      }