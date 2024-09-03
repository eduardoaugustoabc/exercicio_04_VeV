export function waitForDelay(delayInMilliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInMilliseconds));
}
