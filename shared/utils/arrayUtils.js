/* 배열을 지정한 개수씩 잘라 행 단위로 만든다 */
export const chunk = (list, size) =>
  list.reduce((rows, item, index) => {
    if (index % size === 0) rows.push([]);
    rows[rows.length - 1].push(item);
    return rows;
  }, []);
