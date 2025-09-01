import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CustomButtonProps } from '@/types'
import { colors, radius } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Loading from './Loading'

const Button = ({
  style,
  onPress,
  loading = false,
  color = colors.blue,
  children
}: CustomButtonProps) => {

  if(loading){
    return(
      <View style={[styles.button,style,{backgroundColor : 'transparent'}]}>
        <Loading/>
      </View>
    )
  }
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style, {backgroundColor: color}]}>
      {children}
    </TouchableOpacity>
  )
}

export default Button

const styles = StyleSheet.create({
  button:{
    borderRadius:radius._15,
    borderCurve : 'continuous',
    height : verticalScale(52),
    justifyContent : 'center',
    alignItems : "center",
  }
})