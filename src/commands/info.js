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

const { Command, flags } = require('@oclif/command')
const envinfo = require('envinfo')
const chalk = require('chalk')
const yaml = require('js-yaml')

class InfoCommand extends Command {
  indentString (string, count = 2, indent = ' ') {
    return `${indent.repeat(count)}${string}`
  }

  printPlugin (plugin, count = 6, indent = ' ') {
    const asterisk = plugin.asterisk ? chalk.yellow(' (*)') : ''
    this.log(this.indentString(`${plugin.name} ${chalk.gray(plugin.version)}${asterisk}`, count, indent))
  }

  async run () {
    const { flags } = this.parse(InfoCommand)

    try {
      const resInfo = await envinfo.run({
        System: ['OS', 'CPU', 'Memory', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Virtualization: ['Docker'],
        npmGlobalPackages: [this.config.pjson.name]
      }, {
        json: flags.json || flags.yml,
        console: false,
        showNotFound: true
      })

      const plugins = this.config.plugins
        .filter(p => !p.parent)
        .sort((a, b) => a.name < b.name ? -1 : 1)

      const packageJsonCorePlugins = this.config.pjson.oclif.plugins
      const corePlugins = plugins.filter(p => p.type === 'core')

      const mapAsterisk = p => {
        return {
          ...p,
          asterisk: packageJsonCorePlugins.includes(p.name)
        }
      }

      const userPlugins = plugins.filter(p => p.type === 'user').map(mapAsterisk)
      const linkPlugins = plugins.filter(p => p.type === 'link').map(mapAsterisk)

      if (flags.json || flags.yml) {
        // format plugin info as json/yml
        const resObj = JSON.parse(resInfo)
        const mapPlugin = p => {
          const _p = {
            name: p.name,
            version: p.version,
            type: p.type
          }
          if (p.asterisk && (p.type === 'user' || p.type === 'link')) {
            _p.overrides_core_plugin = true
          }
          return _p
        }

        resObj['CLI Plugins'] = {
          core: corePlugins.map(mapPlugin),
          user: userPlugins.map(mapPlugin),
          link: linkPlugins.map(mapPlugin)
        }
        if (flags.yml) {
          this.log(yaml.safeDump(resObj))
        } else {
          this.log(JSON.stringify(resObj, null, 2))
        }
      } else {
        this.log(resInfo)
        this.log(this.indentString('CLI plugins:', 2))
        this.log(this.indentString('core:', 4))
        corePlugins.forEach(p => this.printPlugin(p))
        this.log(this.indentString('user:', 4))
        userPlugins.forEach(p => this.printPlugin(p))
        this.log(this.indentString('link:', 4))
        linkPlugins.forEach(p => this.printPlugin(p))
      }

      const nodeInfo = await envinfo.helpers.getNodeInfo()
      if (!['10', '12', '14'].includes(nodeInfo[1].split('.')[0])) {
        this.warn('Node version not supported. Supported versions are 10, 12, and 14')
      }
    } catch (e) {
      this.error(e)
    }
  }
}

InfoCommand.flags = {
  json: flags.boolean({
    char: 'j',
    description: 'output raw json',
    default: false
  }),
  yml: flags.boolean({
    char: 'y',
    description: 'output yml',
    default: false,
    exclusive: ['json']
  })
}

InfoCommand.description = 'Display dev environment version information'

module.exports = InfoCommand
