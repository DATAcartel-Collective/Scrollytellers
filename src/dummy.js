export default {};
export const connect = async () => ({
  tableNames: async () => [],
  openTable: async () => ({
    add: async () => { },
    vectorSearch: () => ({
      limit: () => ({
        toArray: async () => []
      })
    })
  }),
  createTable: async () => ({
    add: async () => { },
    vectorSearch: () => ({
      limit: () => ({
        toArray: async () => []
      })
    })
  })
});