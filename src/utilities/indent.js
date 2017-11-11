// @flow

export default (message: string, width: number) => {
  return message
    .split('\n')
    .map((line) => {
      return ' '.repeat(width) + line;
    })
    .join('\n')
    .replace(/\s+^/g, '');
};
