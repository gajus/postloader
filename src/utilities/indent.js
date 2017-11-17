// @flow

export default (width: number) => {
  return (message: string) => {
    return message
      .split('\n')
      .map((line) => {
        return ' '.repeat(width) + line;
      })
      .join('\n')
      .replace(/\s+^/g, '');
  };
};
