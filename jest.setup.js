const { stdout } = require('stdout-stderr')

beforeEach(() => {
  stdout.start()
  jest.clearAllMocks()
})
afterEach(() => { stdout.stop() })
