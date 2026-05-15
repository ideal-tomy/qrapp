import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { generateQRDataURL } from '../lib/qr';

interface QRImageProps {
  value: string;
  size?: number;
  className?: string;
  layoutId?: string;
}

export function QRImage({ value, size = 140, className = '', layoutId }: QRImageProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let cancelled = false;
    generateQRDataURL(value, size * 2).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  const inner = src ? (
    <img src={src} width={size - 12} height={size - 12} alt="QR" className="block" />
  ) : null;

  const classNames = `bg-white rounded-lg p-1.5 ${className}`;
  const style = { width: size, height: size };

  if (layoutId) {
    return (
      <motion.div layoutId={layoutId} className={classNames} style={style}>
        {inner}
      </motion.div>
    );
  }

  return (
    <div className={classNames} style={style}>
      {inner}
    </div>
  );
}
