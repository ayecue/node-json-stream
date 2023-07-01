export const transformToNumber = (value: string): number => {
  return Number(value);
};

export const transformToBoolean = (value: string): boolean => {
  return value === 'true';
};
