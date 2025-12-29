import { useRef, useState, MouseEvent } from 'react';
import { useMotionValue, useSpring, MotionValue } from 'framer-motion';

interface UseTiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  maxGlare?: number;
}

interface UseTiltReturn {
  ref: React.RefObject<HTMLElement | null>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  scale: MotionValue<number>;
  glareStyle: {
    background: string;
    opacity: number;
  };
  handleMouseMove: (e: MouseEvent<HTMLElement>) => void;
  handleMouseLeave: () => void;
}

export function useTilt(options: UseTiltOptions = {}): UseTiltReturn {
  const {
    maxTilt = 15,
    // perspective - reserved for future 3D transform effects
    // perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = true,
    maxGlare = 0.5,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [glareOpacity, setGlareOpacity] = useState(0);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scaleValue = useMotionValue(1);

  const springConfig = { damping: 20, stiffness: speed };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  const scaleSpring = useSpring(scaleValue, springConfig);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation
    const rotateYValue = ((mouseX - width / 2) / width) * maxTilt;
    const rotateXValue = ((mouseY - height / 2) / height) * -maxTilt;

    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
    scaleValue.set(scale);

    // Calculate glare position
    if (glare) {
      const glareX = (mouseX / width) * 100;
      const glareY = (mouseY / height) * 100;
      setGlarePosition({ x: glareX, y: glareY });
      setGlareOpacity(maxGlare);
    }
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scaleValue.set(1);
    setGlareOpacity(0);
  };

  return {
    ref,
    rotateX: rotateXSpring,
    rotateY: rotateYSpring,
    scale: scaleSpring,
    glareStyle: {
      background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, transparent 80%)`,
      opacity: glareOpacity,
    },
    handleMouseMove,
    handleMouseLeave,
  };
}