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
const { getProxyForUrl } = require('proxy-from-env')

jest.mock('envinfo')
jest.mock('js-yaml')
jest.mock('proxy-from-env', () => ({
  getProxyForUrl: jest.fn()
}))

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

  test('printProxy', () => {
    command.printProxy(['http'])
    expect(stdout.output).toEqual(command.indentString('http: (not set)\n', 4))

    command.printProxy(['https', 'https://foo.bar'])
    expect(stdout.output).toMatch(command.indentString('https: https://foo.bar\n', 4))
  })

  test('proxyIsValid', () => {
    expect(command.proxyIsValid('http', 'http://foo.bar')).toEqual(true)
    expect(command.proxyIsValid('http', 'https://foo.bar')).toEqual(false)

    expect(command.proxyIsValid('https', 'https://foo.bar')).toEqual(true)
    expect(command.proxyIsValid('https', 'http://foo.bar')).toEqual(false)
  })

  describe('run', () => {
    beforeEach(() => {
      getProxyForUrl.mockRestore()
      getProxyForUrl.mockReturnValue('')
    })

    test('exists', async () => {
      expect(command.run).toBeInstanceOf(Function)
    })

    test('calls envinfo.run', () => {
      command.argv = []
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: []
          },
          engines: {
            node: '14 || 16 || 18'
          }
        },
        plugins: [
          { name: 'name', version: 'version', type: 'type' }
        ]
      }
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

    test('proxies, cli plugins (core, user, link) stdout', () => {
      command.argv = []
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          },
          engines: {
            node: '18'
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
  Proxies:
    http: (not set)
    https: (not set)
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

    test('proxies (mismatch), cli plugins (core, user, link) stdout', () => {
      getProxyForUrl.mockImplementation((url) => {
        if (url.startsWith('http://')) {
          return 'https://foo.bar'
        } else {
          return 'http://foo.bar'
        }
      })

      command.argv = []
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          },
          engines: {
            node: '18'
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
  Proxies:
    http: https://foo.bar (scheme mismatch)
    https: http://foo.bar (scheme mismatch)
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

    test('proxies, cli plugins (core, user, link) --json', () => {
      command.argv = ['-j']
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b',
              'core-plugin-c'
            ]
          },
          engines: {
            node: '18'
          }
        },
        plugins: [
          { name: 'core-plugin-a', version: 'version', type: 'core' },
          { name: 'core-plugin-b', version: 'version', type: 'user' }, // user installed core plugin
          { name: 'core-plugin-c', version: 'version', type: 'link' }, // link installed core plugin
          { name: 'user-plugin', version: 'version', type: 'user' },
          { name: 'link-plugin', version: 'version', type: 'link' }
        ]
      }

      const result = {
        Proxies: {
          http: '',
          https: ''
        },
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
              name: 'core-plugin-c',
              version: 'version',
              type: 'link',
              overrides_core_plugin: true
            },
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

    test('proxies, cli plugins (core, user, link) --yml', async () => {
      command.argv = ['-y']
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: [
              'core-plugin-a',
              'core-plugin-b'
            ]
          },
          engines: {
            node: '18'
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
      Proxies:
        http: ''
        https: ''
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
      yaml.dump.mockImplementation((json) => actualYaml.dump(json))
      envinfo.helpers = { getNodeInfo: () => ['', '12.5.0'] }
      return command.run()
        .then(() => {
          expect(stdout.output).toEqual(result)
        })
    })

    test('calls envinfo.run --json', () => {
      command.argv = ['-j']
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: []
          },
          engines: {
            node: '14 || 16 || 18'
          }
        },
        plugins: [
          { name: 'name', version: 'version', type: 'type' }
        ]
      }
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
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: []
          },
          engines: {
            node: '14 || 16 || 18'
          }
        },
        plugins: [
          { name: 'name', version: 'version', type: 'type' }
        ]
      }
      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      yaml.dump.mockReturnValue('yaml')
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
          expect(yaml.dump).toHaveBeenCalled()
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
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: []
          },
          engines: {
            node: '14 || 16 || 18'
          }
        },
        plugins: [
          { name: 'name', version: 'version', type: 'type' }
        ]
      }
      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      const nodeVersion = '13.5.0'
      envinfo.helpers = { getNodeInfo: () => ['', nodeVersion] }
      await command.run()
      expect(command.warn).toHaveBeenCalledWith(`Node version ${nodeVersion} not supported. Supported versions are ${command.config.pjson.engines.node}`)
    })

    test('plugins list is sorted', async () => {
      command.config = {
        pjson: {
          name: 'ima-cli',
          oclif: {
            plugins: []
          },
          engines: {
            node: '14 || 16 || 18'
          }
        },
        plugins:
          [
            { name: 'name', version: 'version', type: 'type' },
            { name: 'nam', version: 'version', type: 'type' },
            { name: 'name1', version: 'version', type: 'type' }
          ]
      }

      command.warn = jest.fn()
      envinfo.run.mockResolvedValue('{}')
      const nodeVersion = '13.5.0'
      envinfo.helpers = { getNodeInfo: () => ['', nodeVersion] }
      await command.run()
      expect(command.warn).toHaveBeenCalledWith(`Node version ${nodeVersion} not supported. Supported versions are ${command.config.pjson.engines.node}`)
    })
  })
})
