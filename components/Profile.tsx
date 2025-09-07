import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Typo from './Typo';
import { colors } from '@/constants/theme';

interface ProfileProps {
  name: string;
  price: number;
  changeValue: number;
  changePercentage: number;
}

const Profile: React.FC<ProfileProps> = ({ name, price, changeValue, changePercentage }) => {
  const isPositive = changeValue >= 0;
  const changeColor = isPositive ? colors.red100 : colors.blue100;

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/adaptive-icon.png')} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Typo size={20} fontWeight="bold">
          {name}
        </Typo>
        <View style={styles.stockInfo}>
          <Typo size={24} fontWeight="bold" style={{ marginRight: 8 }}>
            $ {price}
          </Typo>
          <Typo size={16} style={{ color: changeColor }}>
            {isPositive ? '▲' : '▼'} {changeValue} ({changePercentage}%)
          </Typo>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default Profile;