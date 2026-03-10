'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';

// --- DESIGN CONFIGURATION ---
const theme = {
  background: 'bg-white',
  text: 'text-[#1a1a1a]',
};

// Copywriting ultra-preciso, focado no impacto e engenharia.
const projects = [
  { 
    id: 1, 
    title: 'Água', 
    description: 'Digital presence and interactive UX for a premium mineral water brand.', 
    link: 'https://agua-tau.vercel.app/' 
  },
  { 
    id: 2, 
    title: 'Comedy Club', 
    description: 'High-conversion booking platform and dynamic showcase for a comedy club.', 
    link: 'https://comedy-club-portifolio.vercel.app/' 
  },
  { 
    id: 3, 
    title: 'Eventation', // Encurtei para dar um nome próprio mais forte
    description: 'Interactive management and showcase platform for live events.', 
    link: 'https://events-portfolio-two.vercel.app/' 
  },
  { 
    id: 4, 
    title: 'Black Cloth', 
    description: 'High-performance, minimalist e-commerce architecture for a fashion label.', 
    // NOTA: Troque este link para o URL do site publicado, o painel da vercel bloqueia iframes.
    link: 'https://clothing-portfolio-rosy.vercel.app/' 
  },
];

// ------------------------------------------------------------------------------
// --- COMPONENT 1: CUSTOM CURSOR ---
// ------------------------------------------------------------------------------
function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const updateMouse = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    const handleOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, canvas')) setIsHovering(true);
      else setIsHovering(false);
    };
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mouseover', handleOver);
    return () => {
      window.removeEventListener('mousemove', updateMouse);
      window.removeEventListener('mouseover', handleOver);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference rounded-full bg-white flex items-center justify-center"
      animate={{
        x: mousePosition.x - (isHovering ? 20 : 10),
        y: mousePosition.y - (isHovering ? 20 : 10),
        width: isHovering ? 40 : 20,
        height: isHovering ? 40 : 20,
      }}
      transition={{ type: 'spring', stiffness: 800, damping: 35, mass: 0.2 }}
    />
  );
}

// ------------------------------------------------------------------------------
// --- COMPONENT 3D: INTERACTIVE VOXEL CUBE ---
// ------------------------------------------------------------------------------
function InteractiveVoxelCube() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  const CUBE_DIMENSION = 10; 
  const CUBE_COUNT = CUBE_DIMENSION * CUBE_DIMENSION * CUBE_DIMENSION; 
  const SPACING = 0.35; 

  const particles = useMemo(() => {
    const temp = [];
    const offset = (CUBE_DIMENSION - 1) / 2;

    for (let i = 0; i < CUBE_DIMENSION; i++) {
      for (let j = 0; j < CUBE_DIMENSION; j++) {
        for (let k = 0; k < CUBE_DIMENSION; k++) {
          const x = (i - offset) * SPACING;
          const y = (j - offset) * SPACING;
          const z = (k - offset) * SPACING;

          temp.push({
            basePosition: new THREE.Vector3(x, y, z),
            currentPosition: new THREE.Vector3(x, y, z),
            currentScale: 1,
          });
        }
      }
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.rotation.y = state.clock.getElapsedTime() * 0.15;
    mesh.rotation.x = state.clock.getElapsedTime() * 0.08;

    state.raycaster.setFromCamera(state.pointer, state.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    
    const isIntersecting = state.raycaster.ray.intersectPlane(plane, intersectPoint);

    if (isIntersecting) {
      intersectPoint.applyEuler(new THREE.Euler(-mesh.rotation.x, -mesh.rotation.y, 0));
    } else {
      intersectPoint.set(999, 999, 999);
    }

    particles.forEach((particle, i) => {
      const distance = particle.basePosition.distanceTo(intersectPoint);
      
      let targetScale = 1;
      let targetPos = particle.basePosition.clone();

      if (distance < 3.0) {
        const influence = 1 - (distance / 3.0); 
        targetScale = 1 - (influence * 0.85); 
        
        const repelDirection = particle.basePosition.clone().sub(intersectPoint).normalize();
        targetPos.add(repelDirection.multiplyScalar(influence * 0.8));
      }

      particle.currentScale += (targetScale - particle.currentScale) * 0.15;
      particle.currentPosition.lerp(targetPos, 0.15);

      dummy.position.copy(particle.currentPosition);
      dummy.scale.set(particle.currentScale, particle.currentScale, particle.currentScale);
      
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, CUBE_COUNT]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial 
          color="#999999" 
          roughness={0.2} 
          metalness={0.8} 
          transparent={true} 
          opacity={0.5} 
        />
      </instancedMesh>
      <pointLight position={[0, 0, 0]} intensity={4} color="#ffffff" distance={8} />
    </group>
  );
}

// ------------------------------------------------------------------------------
// --- MAIN PAGE COMPONENT ---
// ------------------------------------------------------------------------------
export default function PortfolioPage() {
  const horizontalTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: horizontalTrackRef });
  const xTranslate = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']); 

  return (
    <main className={`min-h-screen ${theme.background} selection:bg-[#1a1a1a] selection:text-white cursor-none`}>
      
      <CustomCursor />
      
      {/* 1. HERO SECTION */}
      <section className="relative h-screen w-full overflow-hidden bg-white">
        
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <InteractiveVoxelCube />
            <ContactShadows position={[0, -3.5, 0]} opacity={0.2} scale={15} blur={2.5} far={4.5} />
          </Canvas>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[18vw] md:text-[14vw] font-bold tracking-tighter text-[#1a1a1a] leading-[0.85]"
            style={{ textShadow: '0px 0px 50px rgba(255,255,255,0.9)' }}
          >
            LEONARDO
          </motion.h1>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[18vw] md:text-[14vw] font-bold tracking-tighter text-[#1a1a1a] leading-[0.85]"
            style={{ textShadow: '0px 0px 50px rgba(255,255,255,0.9)' }}
          >
            GAERTNER
          </motion.h1>
        </div>

        <div className="relative z-20 w-full h-full p-8 md:p-12 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start font-mono text-xs uppercase tracking-widest text-[#1a1a1a]">
            <div>
              <p className="font-bold text-lg font-serif mb-1 tracking-normal capitalize">Full Stack Developer</p>
              <p className="opacity-60">Software Engineering Student</p>
            </div>
            <div className="text-right opacity-60 hidden md:block">
              <p>Based in Brazil ✦ 2026</p>
            </div>
          </div>

          <div className="flex justify-between items-end font-mono text-[10px] uppercase tracking-widest text-[#1a1a1a] opacity-60">
            <p className="animate-pulse"></p>
            <p>Projects ↓</p>
          </div>
        </div>
      </section>

      {/* 2. PROJECTS (HORIZONTAL SCROLL) */}
      <section ref={horizontalTrackRef} className="relative h-[400vh] bg-white">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <motion.div style={{ x: xTranslate }} className="flex">
            {projects.map((project) => (
              <div key={project.id} className="h-screen w-screen flex-shrink-0 flex items-center justify-center p-8 md:p-24 border-r border-neutral-200 relative overflow-hidden">
                
                <div className="absolute -top-10 -left-10 md:top-0 md:left-0 text-[35vw] md:text-[25vw] font-bold text-black/5 leading-none z-0 pointer-events-none tracking-tighter">
                  0{project.id}
                </div>
                
                <div className="relative z-10 max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12 w-full items-center">
                  <div className="md:col-span-5">
                    <div className="h-[2px] w-16 bg-neutral-900 mb-8" />
                    <h2 className="text-5xl md:text-7xl font-serif tracking-tight mb-6">{project.title}</h2>
                    <p className="text-lg text-neutral-500 font-light mb-10 max-w-md">{project.description}</p>
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-4 px-8 py-4 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors text-sm uppercase tracking-widest font-medium group"
                    >
                      View Project <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                  
                  {/* Iframe Section - Live Website Preview */}
                  <div className="md:col-span-7 relative w-full aspect-[4/3] md:aspect-[16/10] bg-neutral-100 border border-neutral-200 shadow-xl flex items-center justify-center overflow-hidden">
                     {/* Technical accents */}
                     <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neutral-300 z-20" />
                     <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neutral-300 z-20" />
                     
                     {/* Loading State Text */}
                     <span className="absolute font-mono text-xs text-neutral-400 uppercase tracking-widest z-0">
                       Loading Live Site...
                     </span>

                     {/* The Actual Live Site */}
                     <iframe 
                        src={project.link} 
                        title={`Live preview of ${project.title}`}
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none z-10 opacity-0 transition-opacity duration-1000"
                        onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                        loading="lazy"
                     />
                  </div>
                </div>

              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. FOOTER */}
      <section className="h-[70vh] w-full flex flex-col items-center justify-center bg-[#1a1a1a] text-[#e8e6dc] text-center p-8">
        <h3 className="text-4xl md:text-7xl font-serif tracking-tight max-w-4xl">
          Let's build something exceptional.
        </h3>
        <div className="mt-16 flex gap-8">
          <a href="https://www.linkedin.com/in/leonardo-gaertner-93a087245/" className="text-sm font-mono tracking-widest uppercase hover:text-white transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-[1px] after:bg-current">
            LinkedIn
          </a>
        </div>
      </section>
      
    </main>
  );
}