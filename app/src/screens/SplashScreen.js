import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const containerFade = useRef(new Animated.Value(1)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Zoom in and fade in logo
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // 2. Fade in subtitle
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Pause for user to see logo
      Animated.delay(1200),
      // 4. Zoom slightly and fade out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(containerFade, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [containerFade, onFinish, opacityAnim, scaleAnim, subtitleFade]);

  return (
    <Animated.View style={[styles.container, { opacity: containerFade }]}>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={() => onFinish && onFinish()}
      >
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/ownmypin.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.taglineContainer, { opacity: subtitleFade }]}>
          <Text style={styles.tagline}>
            A smarter way to share your digital address.
          </Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>DIGIPIN Standard • Powered by OwnMyPin</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrapper: {
    width: width * 0.75,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  tagline: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  pillBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
