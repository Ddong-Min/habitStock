import { TasksState } from "@/types";
import beta from "@stdlib/random-base-beta";

const randomPriceGenerator = (mode: keyof TasksState) => {
  const alpha = 5;
  const betaparam = 5;
  let weight;
  let offset;

  if (mode === "easy") {
    weight = 0.2;
    offset = 0;
  } else if (mode === "medium") {
    weight = 0.3;
    offset = 0.1;
  } else if (mode === "hard") {
    weight = 0.4;
    offset = 0.3;
  } else {
    weight = 0.7;
    offset = 0.5;
  }

  const priceGenerator = beta.factory(alpha, betaparam);
  const price = priceGenerator();
  console.log(price);

  return price * weight + offset;
};

export default randomPriceGenerator;
