import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typo from './Typo';
import { colors } from '@/constants/theme';

type ToggleMode = 'todo' | 'bucket';

interface ToggleProps {
  onToggle: (mode: ToggleMode) => void;
}

const Toggle: React.FC<ToggleProps> = ({ onToggle }) => {
  const [activeTab, setActiveTab] = useState<ToggleMode>('todo');

  const handlePress = (mode: ToggleMode) => {
    setActiveTab(mode);
    onToggle(mode);
  };

  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          activeTab === 'todo' ? styles.activeButton : {},
        ]}
        onPress={() => handlePress('todo')}
      >
        <Typo
          size={16}
          fontWeight="bold"
          style={
            activeTab === 'todo' ? styles.activeButtonText : styles.buttonText
          }
        >
          할일
        </Typo>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          activeTab === 'bucket' ? styles.activeButton : {},
        ]}
        onPress={() => handlePress('bucket')}
      >
        <Typo
          size={16}
          fontWeight="bold"
          style={
            activeTab === 'bucket'
              ? styles.activeButtonText
              : styles.buttonText
          }
        >
          목표
        </Typo>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.sub,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  activeButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  buttonText: {
    color: colors.sub,
  },
  activeButtonText: {
    color: colors.black,
  },
});

export default Toggle;