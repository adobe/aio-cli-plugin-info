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
const { cli } = require('cli-ux')
const envinfo = require('envinfo')

// ///////////////
const issueTemplate = `### Expected Behaviour\n
### Actual Behaviour\n
### Reproduce Scenario (including but not limited to)\n
#### Steps to Reproduce\n
#### Environment Info
\`\`\`%replaced%\`\`\`
#### Sample Code that illustrates the problem\n
#### Logs taken while reproducing problem\n`
// ///////////////

class ReportCommand extends Command {
  bugsUrl () {
    // package.json spec: bugs property can be a string, or an object
    const pjson = this.config.pjson
    const bugs = pjson.bugs

    if (bugs && typeof (bugs) === 'string') {
      return bugs
    } else if (bugs && typeof (bugs) === 'object' && bugs.url) {
      return bugs.url
    } else {
      return this.error('Bug reporting url not found.')
    }
  }

  async run () {
    const { flags } = this.parse(ReportCommand)

    const bugsUrl = this.bugsUrl()
    const baseReportUrl = `${bugsUrl}/new/`
    let url
    if (flags.feature) {
      url = `${baseReportUrl}?body=&title=new+feature+request&labels=enhancement`
    } else {
      const resInfo = await envinfo.run({
        System: ['OS', 'CPU', 'Memory', 'Shell'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Virtualization: ['Docker'],
        npmGlobalPackages: ['@adobe/aio-cli']
      }, {
        json: false, console: false, showNotFound: true
      })
      const issueBody = issueTemplate.replace('%replaced%', resInfo)
      url = `${baseReportUrl}?body=${encodeURIComponent(issueBody)}&title=new+bug+report&labels=bug`
    }
    cli.open(url)
  }
}

ReportCommand.flags = {
  bug: flags.boolean({
    char: 'b',
    default: true,
    description: 'report an issue',
    exclusive: ['feature']
  }),
  feature: flags.boolean({
    char: 'f',
    default: false,
    description: 'request a feature',
    exclusive: ['bug']
  })

}

ReportCommand.description = 'Report an issue with the CLI or submit a feature request'

module.exports = ReportCommand
