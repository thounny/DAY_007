      #define size iResolution.xy
      #define SAMPLE(a, p, s) texture((a), (p)/s)

      float gauss(vec2 x, float r) {
          return exp(-pow(length(x)/r, 2.));
      }

      #define SPEED
      #define BLASTER

      #define PI 3.14159265

      #ifdef SPEED
          #define dt 8.5
          #define P 0.01
      #else
          #define dt 2.
          #define P 0.05
      #endif

      #define particle_density 1.
      #define minimal_density 0.8

      const float radius = 2.0;

      uniform sampler2D iChannel0;
      uniform sampler2D iChannel1;
      uniform vec2 iResolution;
      uniform vec4 iMouse;
      uniform float iTime;
      uniform float iFrame;

      void Check(inout vec4 U, vec2 pos, vec2 dx) {
          vec4 Unb = SAMPLE(iChannel0, pos+dx, size);
          vec2 rpos1 = mod(pos-Unb.xy+size*0.5,size) - size*0.5;
          vec2 rpos2 = mod(pos-U.xy+size*0.5,size) - size*0.5;
          if(length(rpos1) < length(rpos2)) {
              U = Unb;
          }
      }

      vec4 B(vec2 pos) {
          return 5.*SAMPLE(iChannel1, pos, size);
      }

      void main() {
          vec2 pos = gl_FragCoord.xy;
          vec4 U = SAMPLE(iChannel0, pos, size);

          Check(U, pos, vec2(-1,0));
          Check(U, pos, vec2(1,0));
          Check(U, pos, vec2(0,-1));
          Check(U, pos, vec2(0,1));
          Check(U, pos, vec2(-1,-1));
          Check(U, pos, vec2(1,1));
          Check(U, pos, vec2(1,-1));
          Check(U, pos, vec2(-1,1));
          U.xy = mod(U.xy,size);

          if(length(mod(pos-U.xy+size*0.5,size) - size*0.5) > 1./minimal_density) {
              U.xy = pos;
          }

          vec2 ppos = U.xy;
          vec2 pressure = vec2(B(ppos+vec2(1,0)).z - B(ppos+vec2(-1,0)).z, B(ppos+vec2(0,1)).z - B(ppos+vec2(0,-1)).z);

          if(iMouse.z > 0.0) {
              float k = gauss(ppos-iMouse.xy, 25.);
              U.zw = U.zw*(1.-k) + k*0.2*vec2(cos(0.02*iTime*dt), sin(0.02*iTime*dt));
          }

          #ifdef BLASTER
              U.zw += 0.002*vec2(cos(0.01*iTime*dt), sin(0.01*iTime*dt))*gauss(ppos-size*vec2(0.5,0.5),8.)*dt;
          #endif

          U.zw = U.zw*0.9995;
          U.zw += P*pressure*dt;
          vec2 velocity = 0.*B(ppos).xy + U.zw;
          U.xy += dt*velocity;
          U.xy = mod(U.xy,size);

          if(iFrame < 1.0) {
              if(mod(pos, vec2(1./particle_density)).x < 1. && mod(pos, vec2(1./particle_density)).y < 1.)
                  U = vec4(pos,0.,0.);
          }

          gl_FragColor = U;
      }