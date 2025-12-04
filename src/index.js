#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { homedir } from "os";

const HOMEDIR = homedir();
const DATA_DIR = path.join(HOMEDIR, ".task-cli");
const DATA_PATH = path.join(DATA_DIR, "data.json");

class Storage {
  static async load() {
    try {
      const data = await readFile(DATA_PATH, { encoding: "utf8" });
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        await Storage.ensureDirectory();
        await Storage.save([]);
        return [];
      }
      throw new Error(`Erro ao acessar o arquivo de dados: ${error.message}`);
    }
  }

  static async save(data) {
    try {
      await Storage.ensureDirectory();
      await writeFile(DATA_PATH, JSON.stringify(data, null, 2), {
        encoding: "utf8",
      });
    } catch (error) {
      throw new Error(`Erro ao salvar dados em ${DATA_PATH}: ${error.message}`);
    }
  }

  static async ensureDirectory() {
    try {
      await mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
}

class TaskService {
  constructor(tasks) {
    this.tasks = tasks;
  }

  static async init() {
    const tasks = await Storage.load();
    return new TaskService(tasks);
  }

  async add(description) {
    if (!description) throw new Error("Description is required!");

    const newTask = {
      id: randomUUID().split("-")[0],
      status: "todo",
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);
    await Storage.save(this.tasks);

    return newTask;
  }

  async remove(id) {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);

    if (this.tasks.length === initialLength)
      throw new Error(`Task ID "${id}" not found!`);

    await Storage.save(this.tasks);
  }

  async update(id, updates = {}) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Task ID "${id}" not found!`);

    const currentTask = this.tasks[index];

    const updatedTask = {
      ...currentTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.tasks[index] = updatedTask;
    await Storage.save(this.tasks);

    return updatedTask;
  }

  list(filterStatus = null) {
    if (!filterStatus) return this.tasks;
    return this.tasks.filter((t) => t.status === filterStatus);
  }
}

const View = {
  colors: {
    reset: "\x1b[0m",
    dim: "\x1b[90m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
  },

  formatDate(isoString) {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(isoString));
  },

  getStatusIcon(status) {
    switch (status) {
      case "done":
        return "✅";
      case "in-progress":
        return "🕐";
      case "todo":
        return "❌";
      default:
        return "❓";
    }
  },

  printList(tasks) {
    if (tasks.length === 0) {
      console.log("No tasks found!");
      return;
    }

    tasks.forEach((task) => {
      const { id, status, description, createdAt, updatedAt } = task;
      const icon = this.getStatusIcon(status);
      const created = this.formatDate(createdAt);
      const updated =
        createdAt === updatedAt
          ? ""
          : `(Updated at: ${this.formatDate(updatedAt)})`;
      console.log(
        `${icon}${this.colors.dim} [${id}]${this.colors.reset} ` +
          `${this.colors.blue}${created} ${updated}${this.colors.reset}\n` +
          `   ${description}\n`,
      );
    });
  },

  printHelp() {
    console.log(`
Usage: task-cli <command> [argument]

Commands:
  add, a <description>          Add new task
  list, l [filter]              List tasks  (todo, done, in-progress)
  update, u <id> <description>  Update description
  remove, r <id>                Remove task
  mark-done, md <id>            Mark as completed
  mark-todo, mt <id>            Mark as pending
  mark-in-progress, mi <id>     Mark as in progress`);
  },

  printError(msg) {
    console.error(`${this.colors.red}Erro: ${msg}${this.colors.reset}`);
  },

  printSuccess(msg) {
    console.log(`${this.colors.green}${msg}${this.colors.reset}`);
  },
};

async function main() {
  try {
    const service = await TaskService.init();
    const args = process.argv.slice(2);
    const command = args[0];
    const params = args.slice(1);

    if (!command) {
      View.printHelp();
      return;
    }

    switch (command) {
      case "a":
      case "add": {
        const desc = params.join(" ");
        await service.add(desc);
        View.printSuccess("Task added!");
        break;
      }

      case "l":
      case "list": {
        const filter = params[0];
        const tasks = service.list(filter);
        View.printList(tasks);
        break;
      }

      case "u":
      case "update": {
        const [id, ...descParts] = params;
        const description = descParts.join(" ");
        // console.log(id);
        // console.log(description);
        if (!id || !description)
          throw new Error("ID and description required!");
        await service.update(id, { description });
        View.printSuccess("Task updated!");
        break;
      }

      case "r":
      case "remove": {
        const [id] = params;
        if (!id) throw new Error("ID  required!");
        await service.remove(id);
        View.printSuccess("Task removed!");
        break;
      }

      case "md":
      case "mark-done":
        await service.update(params[0], { status: "done" });
        View.printSuccess("Task marked as done.");
        break;

      case "mi":
      case "mark-in-progress":
        await service.update(params[0], { status: "in-progress" });
        View.printSuccess("Task marked as in progress.");
        break;

      case "mt":
      case "mark-todo":
        await service.update(params[0], { status: "todo" });
        View.printSuccess("Task marked as to do.");
        break;

      case "h":
      case "help":
        View.printHelp();
        break;

      default:
        View.printError(`Command not found: "${command}"`);
        View.printHelp();
    }
  } catch (error) {
    View.printError(error.message);
  }
}

main();
