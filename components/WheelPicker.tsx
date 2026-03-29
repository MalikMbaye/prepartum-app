import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export const WHEEL_ITEM_H = 52;
export const WHEEL_VISIBLE = 5;
export const WHEEL_H = WHEEL_ITEM_H * WHEEL_VISIBLE;
const PADDING = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
  showHighlight?: boolean;
}

export function WheelPicker({ items, selectedIndex, onSelect, flex = 1, showHighlight = true }: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // activeIdx tracks the visually centered item (driven by scroll position, not prop)
  const activeIdxRef = useRef(selectedIndex);
  const [activeIdx, setActiveIdx] = useState(selectedIndex);
  const currentSelectedRef = useRef(selectedIndex);
  currentSelectedRef.current = selectedIndex;

  // Use contentOffset to set initial scroll position; also add a fast fallback
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_H, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const snap = useCallback((y: number) => {
    const idx = Math.max(0, Math.min(Math.round(y / WHEEL_ITEM_H), items.length - 1));
    ref.current?.scrollTo({ y: idx * WHEEL_ITEM_H, animated: Platform.OS !== 'web' });
    if (idx !== currentSelectedRef.current) {
      try { Haptics.selectionAsync(); } catch {}
      onSelect(idx);
    }
    if (idx !== activeIdxRef.current) {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
    }
  }, [items.length, onSelect]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const newIdx = Math.max(0, Math.min(Math.round(y / WHEEL_ITEM_H), items.length - 1));
    // Update visual highlight in real-time as wheel turns
    if (newIdx !== activeIdxRef.current) {
      activeIdxRef.current = newIdx;
      setActiveIdx(newIdx);
      try { Haptics.selectionAsync(); } catch {}
    }
    // On web: debounce the snap since momentum events don't fire
    if (Platform.OS === 'web') {
      if (snapTimer.current) clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => snap(y), 150);
    }
  }, [items.length, snap]);

  const handleSnapEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snap(e.nativeEvent.contentOffset.y);
  }, [snap]);

  return (
    <View style={[styles.container, { flex }]}>
      {showHighlight && <View style={styles.highlight} />}
      <ScrollView
        ref={ref}
        contentOffset={{ x: 0, y: selectedIndex * WHEEL_ITEM_H }}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleSnapEnd}
        onScrollEndDrag={handleSnapEnd}
        contentContainerStyle={{ paddingVertical: PADDING }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - activeIdx);
          const isSelected = dist === 0;
          return (
            <View
              key={i}
              style={[styles.item, Platform.OS === 'web' ? ({ scrollSnapAlign: 'center' } as any) : null]}
            >
              <Text
                style={[
                  styles.itemText,
                  isSelected
                    ? styles.selectedText
                    : dist === 1
                    ? styles.nearText
                    : dist === 2
                    ? styles.farText
                    : styles.hiddenText,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WHEEL_H,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H,
    backgroundColor: '#F5D6D64D',
    zIndex: 2,
    pointerEvents: 'none',
  },
  item: {
    height: WHEEL_ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Lato_400Regular',
    color: Colors.textPrimary,
  },
  selectedText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    opacity: 1,
  },
  nearText: {
    fontSize: 19,
    opacity: 0.4,
  },
  farText: {
    fontSize: 17,
    opacity: 0.2,
  },
  hiddenText: {
    fontSize: 15,
    opacity: 0.1,
  },
});
