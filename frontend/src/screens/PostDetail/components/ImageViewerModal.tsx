import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Modal, Pressable, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  visible: boolean;
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_DISTANCE = 120;

interface ZoomableProps {
  uri: string;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
  onDismiss: () => void;
  onDragY: (dy: number) => void;
}

// 핀치 줌 / 더블탭 줌 / 확대 시 이동 / 축소 상태에서 아래로 스와이프 닫기
const ZoomableImage: React.FC<ZoomableProps> = ({ uri, width, height, onZoomChange, onDismiss, onDragY }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const cur = useRef({ scale: 1, x: 0, y: 0 }).current;
  const base = useRef({ scale: 1, x: 0, y: 0 }).current;
  const [zoomed, setZoomed] = useState(false);

  const clampPan = (s: number, x: number, y: number) => {
    const maxX = Math.max(0, ((s - 1) * width) / 2);
    const maxY = Math.max(0, ((s - 1) * height) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const apply = (s: number, x: number, y: number, animated: boolean) => {
    cur.scale = s; cur.x = x; cur.y = y;
    const isZ = s > 1.01;
    setZoomed(prev => (prev === isZ ? prev : isZ));
    onZoomChange(isZ);
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: s, useNativeDriver: true, bounciness: 0 }),
        Animated.spring(tx, { toValue: x, useNativeDriver: true, bounciness: 0 }),
        Animated.spring(ty, { toValue: y, useNativeDriver: true, bounciness: 0 }),
      ]).start();
    } else {
      scale.setValue(s); tx.setValue(x); ty.setValue(y);
    }
  };

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => { base.scale = cur.scale; })
    .onUpdate(e => {
      const s = Math.min(MAX_SCALE, Math.max(0.8, base.scale * e.scale));
      const p = clampPan(s, cur.x, cur.y);
      apply(s, p.x, p.y, false);
    })
    .onEnd(() => {
      if (cur.scale < 1) apply(1, 0, 0, true);
    });

  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (!success) return;
      if (cur.scale > 1.01) apply(1, 0, 0, true);
      else apply(DOUBLE_TAP_SCALE, 0, 0, true);
    });

  const zoomPan = Gesture.Pan()
    .runOnJS(true)
    .enabled(zoomed)
    .minDistance(4)
    .onStart(() => { base.x = cur.x; base.y = cur.y; })
    .onUpdate(e => {
      const p = clampPan(cur.scale, base.x + e.translationX, base.y + e.translationY);
      cur.x = p.x; cur.y = p.y;
      tx.setValue(p.x); ty.setValue(p.y);
    });

  const dismissPan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!zoomed)
    .activeOffsetY([-15, 15])
    .failOffsetX([-15, 15])
    .onUpdate(e => {
      ty.setValue(e.translationY);
      onDragY(e.translationY);
    })
    .onEnd(e => {
      if (Math.abs(e.translationY) > DISMISS_DISTANCE || Math.abs(e.velocityY) > 1200) {
        onDismiss();
      } else {
        Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        onDragY(0);
      }
    });

  const gesture = Gesture.Simultaneous(pinch, Gesture.Race(doubleTap, zoomPan, dismissPan));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ width, height, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={{ width, height, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const ImageViewerModal: React.FC<Props> = ({ visible, urls, initialIndex, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const bg = useRef(new Animated.Value(1)).current;
  const listRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setZoomed(false);
      bg.setValue(1);
    }
  }, [visible, initialIndex, bg]);

  const onDragY = useCallback((dy: number) => {
    bg.setValue(Math.max(0.3, 1 - Math.abs(dy) / 400));
  }, [bg]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <ZoomableImage
      uri={item}
      width={width}
      height={height}
      onZoomChange={setZoomed}
      onDismiss={onClose}
      onDragY={onDragY}
    />
  ), [width, height, onClose, onDragY]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        <Animated.View style={{ flex: 1, backgroundColor: '#000', opacity: bg }}>
          <FlatList
            ref={listRef}
            data={urls}
            keyExtractor={(u: string, i: number) => `${i}-${u.slice(-24)}`}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(initialIndex, Math.max(urls.length - 1, 0))}
            getItemLayout={(_: unknown, i: number) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e: any) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={renderItem}
            windowSize={3}
          />
        </Animated.View>

        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }}>
          <View style={{ minWidth: 48 }}>
            {urls.length > 1 && (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{index + 1} / {urls.length}</Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
          >
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default React.memo(ImageViewerModal);
