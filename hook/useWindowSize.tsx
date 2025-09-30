import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

interface Size {
  width: number;
  height: number;
}

function useWindowSize(): Size {
  const [windowSize, setWindowSize] = useState<Size>({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  useEffect(() => {
    // Function to update the window size
    const handleResize = () => {
      setWindowSize({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };

    // Add event listeners for changes in screen dimensions
    const onOrientationChange = handleResize;

    // Listen to changes in screen dimensions (i.e., when orientation changes)
    const subscription = Dimensions.addEventListener(
      "change",
      onOrientationChange
    );

    // Call the handler immediately to set initial window size
    handleResize();

    // Cleanup the event listener when the component unmounts
    return () => {
      subscription?.remove();
    };
  }, []); // Empty array ensures effect runs only once when component mounts

  return windowSize;
}

export default useWindowSize;
