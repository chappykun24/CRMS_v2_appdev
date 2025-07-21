import React from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const ClickableContainer = ({
  children,
  onPress,
  style,
  activeOpacity = 0.9,
  disabled = false,
  showPressEffect = true,
  pressScale = 0.98,
  ...props
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (showPressEffect && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: pressScale,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (showPressEffect && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const ContainerComponent = showPressEffect ? Animated.View : View;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={activeOpacity}
      disabled={disabled}
      style={[styles.container, style]}
      {...props}
    >
      <ContainerComponent
        style={[
          styles.content,
          showPressEffect && { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {children}
      </ContainerComponent>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles
  },
  content: {
    // Content styles
  },
});

export default ClickableContainer; 