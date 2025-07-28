import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, View } from 'react-native';

const images = [
  require('../../assets/images/homepage-webslider-1.jpg'),
  require('../../assets/images/Alangilan-entrance-facade.jpg'),
  require('../../assets/images/204107.jpg'),
];

const SLIDE_INTERVAL = 5000; // 5 seconds
const { width, height } = Dimensions.get('window');

const CAMPUS_NAME = 'Batangas State University';

export default function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [containerWidth, setContainerWidth] = useState(width);
  const scrollViewRef = useRef(null);
  const intervalRef = useRef(null);

  const onLayout = (event) => {
    const { width: layoutWidth } = event.nativeEvent.layout;
    setContainerWidth(layoutWidth);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const nextIndex = (current + 1) % images.length;
      setCurrent(nextIndex);
      
      // Scroll to next image
      scrollViewRef.current?.scrollTo({
        x: nextIndex * containerWidth,
        animated: true
      });
    }, SLIDE_INTERVAL);
    
    return () => clearInterval(intervalRef.current);
  }, [current, containerWidth]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollPosition / containerWidth);
    
    if (currentIndex !== current) {
      setCurrent(currentIndex);
    }
  };

  return (
    <View style={styles.flexContainer}>
      <View style={styles.container} onLayout={onLayout}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {images.map((image, index) => (
            <View key={index} style={[styles.imageContainer, { width: containerWidth }]}>
              <Animated.Image
                source={image}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>
      </View>
      
      {/* Pagination dots - moved outside */}
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { opacity: index === current ? 1 : 0.5 }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
    paddingHorizontal: 20, // Added horizontal spacing
  },
  container: {
    width: '100%',
    aspectRatio: 16 / 9, // Changed from 16/10 to 16/9 for more height
    overflow: 'hidden',
    backgroundColor: '#eee',

    position: 'relative',
    marginHorizontal: 0,
    padding: 0,
    borderRadius: 16, // Added rounded corners
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#DC2626',
  },
}); 