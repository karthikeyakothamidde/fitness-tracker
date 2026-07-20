import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Play, Square, FastForward, Plus, Minus, BellRing } from 'lucide-react-native';
import { CircularProgress } from './CircularProgress';

// -------------------------------------------------------------
// Active Workout Duration Timer Display
// -------------------------------------------------------------
interface FormattedTimerProps {
  startTime: number;
}

export const FormattedTimer: React.FC<FormattedTimerProps> = ({ startTime }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Initial sync
    setSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));

    const interval = setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  return <Text style={styles.durationText}>{formatTime(seconds)}</Text>;
};

// -------------------------------------------------------------
// Rest Timer Countdown Sheet Overlay
// -------------------------------------------------------------
interface RestTimerProps {
  visible: boolean;
  initialSeconds?: number;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  visible,
  initialSeconds = 60,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (visible) {
      setTimeLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsActive(true);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    let interval: any = null;

    if (visible && isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && visible) {
      // Completed, close automatically
      setIsActive(false);
      onClose();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, isActive, timeLeft, onClose]);

  const adjustTime = (amount: number) => {
    const newTime = Math.max(10, timeLeft + amount);
    setTimeLeft(newTime);
    if (newTime > totalSeconds) {
      setTotalSeconds(newTime);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <BellRing size={20} color="#F59E0B" />
            <Text style={styles.title}>REST TIMER</Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={styles.timerContainer}>
            <CircularProgress
              size={150}
              strokeWidth={10}
              progress={progress}
              color="#F59E0B" // Gold warning color
              backgroundColor="#27272A"
            >
              <View style={styles.innerTimer}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerSub}>Time Remaining</Text>
              </View>
            </CircularProgress>
          </View>

          {/* Time adjustments */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(-15)}>
              <Minus size={16} color="#A1A1AA" />
              <Text style={styles.adjustText}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(15)}>
              <Plus size={16} color="#A1A1AA" />
              <Text style={styles.adjustText}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Control Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#27272A' }]} 
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={styles.actionBtnText}>{isActive ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: '#F59E0B' }]} 
              onPress={onClose}
            >
              <FastForward size={18} color="#09090B" />
              <Text style={[styles.actionBtnText, { color: '#09090B', marginLeft: 4 }]}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  durationText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'system-ui',
    letterSpacing: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B', // zinc-900
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  timerContainer: {
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerTimer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  timerText: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerSub: {
    color: '#71717A',
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  adjustText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
});
