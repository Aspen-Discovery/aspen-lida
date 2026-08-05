export function formatLists(data) {
     let lists = [];

     if (data !== undefined) {
          const raw = data.lists ?? data;
          lists = Array.isArray(raw) ? [...raw].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')) : [];
     }

     return lists;
}
