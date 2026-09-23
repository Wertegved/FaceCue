const PARTICLE_TYPES = ['star', 'star', 'star', 'triangle', 'triangle', 'square', 'square'];
const PARTICLE_COUNT = 154;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const type = PARTICLE_TYPES[index % PARTICLE_TYPES.length];
    const size = randomBetween(type === 'star' ? 2 : 3, type === 'star' ? 5 : 7);

    return {
      id: `${type}-${index}`,
      type,
      size,
      opacity: Math.random() > 0.84 ? randomBetween(0.72, 0.85) : randomBetween(0.25, 0.65),
      duration: randomBetween(7, 15),
      delay: randomBetween(-15, 0),
      x: randomBetween(-4, 104),
      startY: randomBetween(-115, -8),
      drift: randomBetween(250, 500),
      rotation: randomBetween(-35, 35),
      twinkle: type === 'star' && Math.random() > 0.62,
    };
  });
}

const PARTICLES = createParticles();

function ParticleBackground() {
  return (
    <div className="particle-background" aria-hidden="true">
      {PARTICLES.map((particle) => (
        <span
          key={particle.id}
          className={`background-particle particle-${particle.type}${particle.twinkle ? ' particle-twinkle' : ''}`}
          style={{
            '--particle-size': `${particle.size}px`,
            '--particle-opacity': particle.opacity,
            '--particle-duration': `${particle.duration}s`,
            '--particle-delay': `${particle.delay}s`,
            '--particle-x': `${particle.x}vw`,
            '--particle-start-y': `${particle.startY}vh`,
            '--particle-drift': `${particle.drift}px`,
            '--particle-rotation': `${particle.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}

export default ParticleBackground;
