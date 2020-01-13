import ProductOption from '@/constants/ProductConstants';

// 获取枚举对应值
export function getEnumValue(key, value) {
  let obj = ProductOption[key].find(item => {
    if (value === null) {
      return null;
    }
    if (value === item.id) {
      return item;
    }
  });
  return obj ? obj.name : '-';
}

// 获取最大最小值
export function getMinAndMax(obj, params) {
  const max = obj[params] && obj[params][0].max ? obj[params][0].max : 999999999;
  const min = obj[params] && obj[params][0].min ? obj[params][0].min : 0;
  const result = {
    max: Number(max),
    min: Number(min),
  };
  return result;
}
