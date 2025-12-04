# task-cli

[roadmap.sh](https://roadmap.sh/projects/task-tracker) project

## Overview

Project used to track and manage tasks using a command line interface

## Requirements

- Node.js
- npm

## Installation & Usage

1. Install the program globally using npm

```bash
npm install -g git+https://github.com/ludwiklejzer/task-cli.git
```

2. Make sure npm global packages are in your PATH and run `task-cli`

```
Usage: task-cli <command> [argument]

Commands:
  add, a <description>          Add new task
  list, l [filter]              List tasks  (todo, done, in-progress)
  update, u <id> <description>  Update description
  remove, r <id>                Remove task
  mark-done, md <id>            Mark as completed
  mark-todo, mt <id>            Mark as pending
  mark-in-progress, mi <id>     Mark as in progress`);
```

## Uninstall

```bash
npm uninstall -g task-cli
```

# License

This project is licensed under the MIT License.
