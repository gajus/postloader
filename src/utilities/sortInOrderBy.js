// @flow

import _ from 'lodash';

/**
 * Orders records in an order of `order` values using `using` property of the haystack item.
 */
export default <ItemType>(
  haystack: $ReadOnlyArray<ItemType>,
  order: $ReadOnlyArray<string | number>,
  using: string
): $ReadOnlyArray<ItemType> => {
  if (haystack.length !== order.length) {
    throw new Error('Haystack length does not match the guide length.');
  }

  return _.sortBy(haystack, (item) => {
    const targetValue = item[using];

    if (targetValue === undefined) {
      throw new TypeError('Target property does not exist.');
    }

    const index = order.indexOf(targetValue);

    if (index === -1) {
      throw new Error('Corresponding value does not exist in the haystack.');
    }

    return index;
  });
};
