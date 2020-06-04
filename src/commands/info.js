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

const NEW_LINE = '\n'
const INDENT = (n) => '  '.repeat(n)
const AIO_PLUGINS = 'AioPlugins'

class InfoCommand extends Command {

  async run() {
    const { flags } = this.parse(InfoCommand)

    try {
      this.resInfo = await envinfo.run({
        System: ['OS', 'CPU', 'Memory', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Virtualization: ['Docker'],
        npmGlobalPackages: [this.config.pjson.name]
      },{
        json: flags.json, console: false, showNotFound: true
      })
      this.getAioPluginsInfo(flags)
      this.log(this.resInfo)
    } catch (e) {
      this.error(e)
    }
  }

  getAioPluginsInfo(flags) {
    if(flags.json) {
      let resInfo = JSON.parse(this.resInfo)
      resInfo[AIO_PLUGINS] = {}
      this.config.plugins.forEach(plugin => {
        resInfo[AIO_PLUGINS][plugin.name] = {
          version: plugin.version,
          type: plugin.core
        }
      })
      this.resInfo = JSON.stringify(resInfo, null, 2)
    } else {
      let output = INDENT(1) + `${AIO_PLUGINS}:` + NEW_LINE
      this.config.plugins.forEach(plugin => {
          output += INDENT(2) + `${plugin.name}: ${plugin.version} - ${plugin.type}` + NEW_LINE
      })
      this.resInfo += output
    }
  }
}

InfoCommand.flags = {
  json: flags.boolean({
    char: 'j',
    description: 'output raw json',
    default: false
  })
}

InfoCommand.description = 'Display dev environment version information'

module.exports = InfoCommand
