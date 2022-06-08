<!--
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
-->

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@adobe/aio-cli-plugin-info.svg)](https://npmjs.org/package/@adobe/aio-cli-plugin-info)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-cli-plugin-info.svg)](https://npmjs.org/package/@adobe/aio-cli-plugin-info)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aio-cli-plugin-info/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-cli-plugin-info/)
[![Github Issues](https://img.shields.io/github/issues/adobe/aio-cli-plugin-info.svg)](https://github.com/adobe/aio-cli-plugin-info/issues)
[![Github Pull Requests](https://img.shields.io/github/issues-pr/adobe/aio-cli-plugin-info.svg)](https://github.com/adobe/aio-cli-plugin-info/pulls) 

# aio-cli-plugin-info

---

Environment info commands for troubleshooting, and reporting issues

<!-- toc -->
* [aio-cli-plugin-info](#aio-cli-plugin-info)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage
```sh-session
$ aio plugins:install -g @adobe/aio-cli-plugin-info
$ # OR
$ aio discover -i
$ aio info --help
```

# Commands
<!-- commands -->
* [`aio info`](#aio-info)
* [`aio report`](#aio-report)

## `aio info`

Display dev environment version information

```
USAGE
  $ aio info [-y | -j]

FLAGS
  -j, --json  output raw json
  -y, --yml   output yml

DESCRIPTION
  Display dev environment version information
```

_See code: [src/commands/info.ts](https://github.com/adobe/aio-cli-plugin-info/blob/2.1.0/src/commands/info.ts)_

## `aio report`

Report an issue with the CLI or submit a feature request

```
USAGE
  $ aio report [-b | -f]

FLAGS
  -b, --bug      report an issue
  -f, --feature  request a feature

DESCRIPTION
  Report an issue with the CLI or submit a feature request
```

_See code: [src/commands/report.ts](https://github.com/adobe/aio-cli-plugin-info/blob/2.1.0/src/commands/report.ts)_
<!-- commandsstop -->

## Contributing

Contributions are welcomed! Read the [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
