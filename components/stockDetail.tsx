import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useAuth } from "../contexts/authContext";
import { useStock } from "../contexts/stockContext";

const stockSummary = () => {
  const { user } = useAuth();
  const { stockData } = useStock();

  return (
    <View>
      <Text>stockDetail</Text>
    </View>
  );
};

export default stockSummary;

const styles = StyleSheet.create({});
