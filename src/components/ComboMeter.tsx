import { AnimatePresence, motion } from 'framer-motion';
import { springBouncy } from '../ui/motion';
import './ComboMeter.css';

interface ComboMeterProps {
  combo: number;
}

export function ComboMeter({ combo }: ComboMeterProps) {
  const visible = combo >= 2;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="combo-meter"
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={springBouncy}
          key={combo}
        >
          <span className="combo-meter__label">Combo</span>
          <span className="combo-meter__count">×{combo}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
