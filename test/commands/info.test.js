/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const Command = require('../../src/commands/info')
const { stdout } = require('stdout-stderr')
const envinfo = require('envinfo')

jest.mock('envinfo')

beforeAll(() => stdout.start())
afterAll(() => stdout.stop())

test('exports', async () => {
  expect(typeof Command).toEqual('function')
})

test('description', async () => {
  expect(Command.description).toBeDefined()
})

test('flags', async () => {
  expect(Command.flags).toBeDefined()
})

// eslint-disable-next-line jest/no-commented-out-tests
// test('args', async () => {
//   expect(Command.args).toBeDefined()
// })

test('aliases', async () => {
  expect(Command.aliases).toBeDefined()
})

describe('instance methods', () => {
  let command

  beforeEach(() => {
    command = new Command([])
  })

  describe('run', () => {
    test('exists', async () => {
      expect(command.run).toBeInstanceOf(Function)
    })

    test('calls envinfo.run', () => {
      command.argv = []
      command.config = { pjson: { name: 'ima-cli' } }
      envinfo.run.mockResolvedValue('ok')
      return command.run()
        .then(() => {
          expect(envinfo.run).toHaveBeenCalledWith(expect.objectContaining({
            Binaries: expect.any(Array),
            System: expect.any(Array),
            Virtualization: expect.any(Array),
            npmGlobalPackages: expect.any(Array)
          }), expect.objectContaining({
            json: false,
            console: false
          }))
          expect(stdout.output).toMatch('')
        })
    })

    test('calls envinfo.run --json', () => {
      command.argv = ['-j']
      command.config = { pjson: { name: 'ima-cli' } }
      envinfo.run.mockResolvedValue('ok')
      return command.run()
        .then(() => {
          expect(envinfo.run).toHaveBeenCalledWith(expect.objectContaining({
            Binaries: expect.any(Array),
            System: expect.any(Array),
            Virtualization: expect.any(Array),
            npmGlobalPackages: expect.any(Array)
          }), expect.objectContaining({
            json: true,
            console: false
          }))
          expect(stdout.output).toMatch('')
        })
    })
  })
})
