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
const yaml = require('js-yaml')
const actualYaml = jest.requireActual('js-yaml')
const dedent = require('dedent')

jest.mock('envinfo')
jest.mock('js-yaml')

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

test('aliases', async () => {
  expect(Command.aliases).toBeDefined()
})

describe('instance methods', () => {
  let command

  beforeEach(() => {
    command = new Command([])
  })

  test('indentString', () => {
    const string = 'mystring'
    const result = command.indentString(string)
    expect(result).toEqual('  ' + string)
  })

  test('printPlugin', () => {
    command.printPlugin({ name: 'name', version: 'version' })
    expect(stdout.output).toEqual(command.indentString('name version\n', 6))

    command.printPlugin({ name: 'name2', version: 'version2', asterisk: true })
    expect(stdout.output).toMatch(command.indentString('name2 version2 (*)\n', 6))
  })

  describe('run', () => {
    test('exists', async () => {
      expect(command.run).toBeInstanceOf(Function)
    })

    test('calls envinfo.run', () => {
      command.argv = []
      command.config = { pjson: { name: 'ima-cli', oclif: { plugins: [] } }, plugins: [{ name: 'name', version: 'version', type: 'type' }] }
      envinfo.run.mockResolvedValue('ok')
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
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

    test('cli plugins (core, user, link) stdout', () => {
      command.argv = []
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          }
        },
        plugins: [
          { name: 'core-plugin-a', version: 'version', type: 'core' },
          { name: 'core-plugin-b', version: 'version', type: 'user' }, // user installed core plugin
          { name: 'user-plugin', version: 'version', type: 'user' },
          { name: 'link-plugin', version: 'version', type: 'link' }
        ]
      }

      const result = `
  CLI plugins:
    core:
      core-plugin-a version
    user:
      core-plugin-b version (*)
      user-plugin version
    link:
      link-plugin version\n`

      envinfo.run.mockResolvedValue('')
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
      return command.run()
        .then(() => {
          expect(stdout.output).toMatch(result)
        })
    })

    test('cli plugins (core, user, link) --json', () => {
      command.argv = ['-j']
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          }
        },
        plugins: [
          { name: 'core-plugin-a', version: 'version', type: 'core' },
          { name: 'core-plugin-b', version: 'version', type: 'user' }, // user installed core plugin
          { name: 'user-plugin', version: 'version', type: 'user' },
          { name: 'link-plugin', version: 'version', type: 'link' }
        ]
      }

      const result = {
        'CLI Plugins': {
          core: [
            {
              name: 'core-plugin-a',
              version: 'version',
              type: 'core'
            }
          ],
          user: [
            {
              name: 'core-plugin-b',
              version: 'version',
              type: 'user',
              overrides_core_plugin: true
            },
            {
              name: 'user-plugin',
              version: 'version',
              type: 'user'
            }
          ],
          link: [
            {
              name: 'link-plugin',
              version: 'version',
              type: 'link'
            }
          ]
        }
      }

      envinfo.run.mockResolvedValue('{}')
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
      return command.run()
        .then(() => {
          expect(stdout.output).toMatch(JSON.stringify(result, null, 2))
        })
    })

    test('cli plugins (core, user, link) --yml', async () => {
      command.argv = ['-y']
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          }
        },
        plugins: [
          { name: 'core-plugin-a', version: 'version', type: 'core' },
          { name: 'core-plugin-b', version: 'version', type: 'user' }, // user installed core plugin
          { name: 'user-plugin', version: 'version', type: 'user' },
          { name: 'link-plugin', version: 'version', type: 'link' }
        ]
      }

      const result = dedent`
      CLI Plugins:
        core:
          - name: core-plugin-a
            version: version
            type: core
        user:
          - name: core-plugin-b
            version: version
            type: user
            overrides_core_plugin: true
          - name: user-plugin
            version: version
            type: user
        link:
          - name: link-plugin
            version: version
            type: link\n\n
      `

      envinfo.run.mockResolvedValue('{}')
      yaml.safeDump.mockImplementation((json) => actualYaml.safeDump(json))
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
      return command.run()
        .then(() => {
          expect(stdout.output).toEqual(result)
        })
    })

    test('calls envinfo.run --json', () => {
      command.argv = ['-j']
      command.config = { pjson: { name: 'ima-cli', oclif: { plugins: [] } }, plugins: [{ name: 'name', version: 'version', type: 'type' }] }
      envinfo.run.mockResolvedValue('{}')
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
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

    test('calls envinfo.run --yml', () => {
      command.argv = ['-y']
      command.config = { pjson: { name: 'ima-cli', oclif: { plugins: [] } }, plugins: [{ name: 'name', version: 'version', type: 'type' }] }
      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      yaml.safeDump.mockReturnValue('yaml')
      envinfo.helpers = { getNodeInfo: () => ['', '14.5.0'] }
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
          expect(yaml.safeDump).toHaveBeenCalled()
          expect(command.warn).not.toHaveBeenCalled()
        })
    })

    test('catches error', async () => {
      command.config = null
      command.error = jest.fn()
      await command.run()
      expect(command.error).toHaveBeenCalled()
    })

    test('warns if node is not supported', async () => {
      command.config = { pjson: { name: 'ima-cli', oclif: { plugins: [] } }, plugins: [{ name: 'name', version: 'version', type: 'type' }] }
      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      envinfo.helpers = { getNodeInfo: () => ['', '13.5.0'] }
      await command.run()
      expect(command.warn).toHaveBeenCalledWith('Node version not supported. Supported versions are 10, 12, and 14')
    })

    test('plugins list is sorted', async () => {
      command.config = { pjson: { name: 'ima-cli', oclif: { plugins: [] } }, plugins: [{ name: 'name', version: 'version', type: 'type' }, { name: 'nam', version: 'version', type: 'type' }, { name: 'name1', version: 'version', type: 'type' }] }
      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      envinfo.helpers = { getNodeInfo: () => ['', '13.5.0'] }
      await command.run()
      expect(command.warn).toHaveBeenCalledWith('Node version not supported. Supported versions are 10, 12, and 14')
    })
  })
})
