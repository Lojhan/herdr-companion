// Generated from pinned herdr-core 0.1.14 (Apache-2.0). Do not edit.
export const coreSchemas = {
  "components": {
    "schemas": {
      "AttachResult": {
        "properties": {
          "channel": {
            "description": "Stream channel: first paint, then live bytes. Send keys as DATA on it;\nRESIZE, FOCUS, FACTS, CREDIT and CLOSE frames control it.",
            "format": "uint32",
            "minimum": 0,
            "type": "integer"
          },
          "terminal": {
            "$ref": "#/components/schemas/Terminal"
          }
        },
        "required": [
          "channel",
          "terminal"
        ],
        "type": "object"
      },
      "Children": {
        "enum": [
          "any",
          "all"
        ],
        "type": "string"
      },
      "CoreInfo": {
        "properties": {
          "id": {
            "description": "Permanent random id, reset only when state is wiped.",
            "type": "string"
          },
          "name": {
            "description": "Display name, the hostname by default.",
            "type": "string"
          }
        },
        "required": [
          "id",
          "name"
        ],
        "type": "object"
      },
      "Display": {
        "description": "What a viewer's own terminal looks like, reported by the client.",
        "properties": {
          "bg": {
            "description": "Default background as `#rrggbb`.",
            "type": [
              "string",
              "null"
            ]
          },
          "cell": {
            "description": "Cell size in pixels: `[width, height]`.",
            "items": {
              "format": "uint32",
              "minimum": 0,
              "type": "integer"
            },
            "maxItems": 2,
            "minItems": 2,
            "type": [
              "array",
              "null"
            ]
          },
          "cursor": {
            "description": "Cursor color as `#rrggbb`.",
            "type": [
              "string",
              "null"
            ]
          },
          "fg": {
            "description": "Default foreground as `#rrggbb`.",
            "type": [
              "string",
              "null"
            ]
          }
        },
        "type": "object"
      },
      "DocGetResult": {
        "properties": {
          "value": true,
          "version": {
            "description": "Zero when never written. Deletions retain their version.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "value",
          "version"
        ],
        "type": "object"
      },
      "DocSetResult": {
        "properties": {
          "version": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "version"
        ],
        "type": "object"
      },
      "Edit": {
        "properties": {
          "new": {
            "type": "string"
          },
          "old": {
            "description": "Exact text, found exactly once in the file as it was.",
            "type": "string"
          }
        },
        "required": [
          "old",
          "new"
        ],
        "type": "object"
      },
      "ExecResult": {
        "properties": {
          "code": {
            "description": "Its exit code; null when a signal ended it.",
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "ms": {
            "description": "How long it ran, in milliseconds.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "signal": {
            "description": "The signal that ended it (Unix).",
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "stderr": {
            "description": "What it wrote, base64: the first 1 MB.",
            "type": "string"
          },
          "stdout": {
            "description": "What it wrote, base64: the first 8 MB.",
            "type": "string"
          },
          "timed_out": {
            "description": "It ran out of time and was ended: the output is what came so far.",
            "type": "boolean"
          },
          "truncated": {
            "description": "It wrote more than was kept (it still ran to its end).",
            "type": "boolean"
          }
        },
        "required": [
          "stdout",
          "stderr",
          "truncated",
          "timed_out",
          "ms"
        ],
        "type": "object"
      },
      "FileReadResult": {
        "properties": {
          "first": {
            "description": "The first and last line given (last < first: none).",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "last": {
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "lines": {
            "description": "Lines in the file.",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "text": {
            "description": "The lines as they are in the file, line ends kept.",
            "type": "string"
          }
        },
        "required": [
          "text",
          "first",
          "last",
          "lines"
        ],
        "type": "object"
      },
      "FileResult": {
        "properties": {
          "bytes": {
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "path": {
            "description": "The file written, absolute.",
            "type": "string"
          }
        },
        "required": [
          "path",
          "bytes"
        ],
        "type": "object"
      },
      "FirstMessage": {
        "properties": {
          "reason": {
            "description": "Why it was not sent.",
            "type": [
              "string",
              "null"
            ]
          },
          "sent": {
            "type": "boolean"
          },
          "started": {
            "description": "Whether the agent started working on it (see terminal.send).",
            "type": [
              "boolean",
              "null"
            ]
          },
          "turn": {
            "description": "The turn when it went in (see terminal.send).",
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          }
        },
        "required": [
          "sent"
        ],
        "type": "object"
      },
      "Foreground": {
        "properties": {
          "argv": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "cwd": {
            "description": "Its working directory now (resolved by the OS).",
            "type": "string"
          },
          "name": {
            "description": "Its name as the OS has it (`node`, `vim`, `sh`).",
            "type": "string"
          },
          "pid": {
            "description": "The foreground process group's leader.",
            "format": "int32",
            "type": "integer"
          }
        },
        "required": [
          "pid",
          "name",
          "argv",
          "cwd"
        ],
        "type": "object"
      },
      "HelloResult": {
        "properties": {
          "core": {
            "$ref": "#/components/schemas/CoreInfo"
          },
          "features": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "framed": {
            "type": "boolean"
          },
          "generation": {
            "format": "uint32",
            "minimum": 0,
            "type": "integer"
          },
          "methods": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "version": {
            "type": "string"
          }
        },
        "required": [
          "generation",
          "version",
          "core",
          "framed",
          "methods",
          "features"
        ],
        "type": "object"
      },
      "HolderInfo": {
        "properties": {
          "current": {
            "description": "Same build as the core: takes new terminals. Others drain.",
            "type": "boolean"
          },
          "instance": {
            "type": "string"
          },
          "pid": {
            "format": "uint32",
            "minimum": 0,
            "type": "integer"
          },
          "terminals": {
            "description": "Live terminals it runs.",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "pid",
          "instance",
          "current",
          "terminals"
        ],
        "type": "object"
      },
      "IdleOrWorking": {
        "enum": [
          "idle",
          "working"
        ],
        "type": "string"
      },
      "InterruptResult": {
        "properties": {
          "key": {
            "description": "The key sent: esc for programs that report status, else ctrl+c.",
            "type": "string"
          },
          "outcome": {
            "description": "stopped (left working, or a shell got its prompt back), exited,\nstill_working (no change in time), or unknown (it doesn't report status).",
            "type": "string"
          }
        },
        "required": [
          "outcome",
          "key"
        ],
        "type": "object"
      },
      "KeysResult": {
        "properties": {
          "status": {
            "type": [
              "string",
              "null"
            ]
          },
          "turn": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "turn"
        ],
        "type": "object"
      },
      "ListResult": {
        "properties": {
          "hidden_finished": {
            "description": "Finished terminals left out (see `all`).",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "machines": {
            "description": "Machines added here and their lines: one that is not connected is\nlisted here, not waited on.",
            "items": {
              "$ref": "#/components/schemas/MachineView"
            },
            "type": "array"
          },
          "terminals": {
            "description": "This machine's terminals, then each connected machine's (`machine/t7`).",
            "items": {
              "$ref": "#/components/schemas/Terminal"
            },
            "type": "array"
          }
        },
        "required": [
          "terminals",
          "hidden_finished",
          "machines"
        ],
        "type": "object"
      },
      "Machine": {
        "properties": {
          "host": {
            "description": "What that core calls itself (its hostname).",
            "type": "string"
          },
          "id": {
            "description": "The other core's permanent id.",
            "type": "string"
          },
          "name": {
            "description": "What this core calls it: `rohan` in `rohan/t7`.",
            "type": "string"
          },
          "session": {
            "description": "The hc session there (null: its default).",
            "type": [
              "string",
              "null"
            ]
          },
          "target": {
            "description": "How it is reached: an ssh target, or (`via`) a command.",
            "type": "string"
          },
          "temporary": {
            "default": false,
            "description": "Short-lived (a sandbox for a task): clients may show it apart from the\nmachines that stay. hc treats it like any other.",
            "type": "boolean"
          },
          "version": {
            "description": "Its hc version when last seen.",
            "type": "string"
          },
          "via": {
            "default": false,
            "description": "`target` is a command that runs a shell line there, given as its last\nargument, like ssh (a provider's own CLI, ssh with its options).",
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "target",
          "id",
          "host",
          "version"
        ],
        "type": "object"
      },
      "MachineListResult": {
        "properties": {
          "machines": {
            "items": {
              "$ref": "#/components/schemas/MachineView"
            },
            "type": "array"
          }
        },
        "required": [
          "machines"
        ],
        "type": "object"
      },
      "MachineView": {
        "description": "A machine as `machine ls` and `ls` show it: its profile and its line now.",
        "properties": {
          "host": {
            "description": "What that core calls itself (its hostname).",
            "type": "string"
          },
          "id": {
            "description": "The other core's permanent id.",
            "type": "string"
          },
          "name": {
            "description": "What this core calls it: `rohan` in `rohan/t7`.",
            "type": "string"
          },
          "session": {
            "description": "The hc session there (null: its default).",
            "type": [
              "string",
              "null"
            ]
          },
          "since_ms": {
            "description": "Since when it is not connected (ms since the epoch).",
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "state": {
            "description": "connecting, connected, needs_login or unreachable.",
            "type": "string"
          },
          "target": {
            "description": "How it is reached: an ssh target, or (`via`) a command.",
            "type": "string"
          },
          "temporary": {
            "default": false,
            "description": "Short-lived (a sandbox for a task): clients may show it apart from the\nmachines that stay. hc treats it like any other.",
            "type": "boolean"
          },
          "version": {
            "description": "Its hc version when last seen.",
            "type": "string"
          },
          "via": {
            "default": false,
            "description": "`target` is a command that runs a shell line there, given as its last\nargument, like ssh (a provider's own CLI, ssh with its options).",
            "type": "boolean"
          },
          "why": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "name",
          "target",
          "id",
          "host",
          "version",
          "state"
        ],
        "type": "object"
      },
      "PutResult": {
        "properties": {
          "bytes": {
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "path": {
            "description": "Where it landed, as the terminal's machine sees it.",
            "type": "string"
          }
        },
        "required": [
          "path",
          "bytes"
        ],
        "type": "object"
      },
      "ReadResult": {
        "properties": {
          "complete": {
            "description": "False when part of what was asked for may be missing.",
            "type": "boolean"
          },
          "how": {
            "description": "\"screen\", \"history\", or \"stitched\" (a full-screen app, read by scrolling it).",
            "type": "string"
          },
          "text": {
            "type": "string"
          },
          "why": {
            "description": "Why only the screen: \"working\" (a full-screen app isn't scrolled while\nit works; read again once it stops).",
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "text",
          "complete",
          "how"
        ],
        "type": "object"
      },
      "RemoveResult": {
        "properties": {
          "removed": {
            "type": "string"
          }
        },
        "required": [
          "removed"
        ],
        "type": "object"
      },
      "RunResult": {
        "properties": {
          "address": {
            "description": "`t7`: this terminal forever on this core.",
            "type": "string"
          },
          "argv": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "cols": {
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "created_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "cwd": {
            "type": "string"
          },
          "die_with_parent": {
            "default": false,
            "type": "boolean"
          },
          "exit_code": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "finished_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "first_message": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/FirstMessage"
              },
              {
                "type": "null"
              }
            ],
            "description": "Template runs: whether the first message went in."
          },
          "foreground": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/Foreground"
              },
              {
                "type": "null"
              }
            ],
            "description": "What runs in it right now and where (null once it has finished)."
          },
          "identity": {
            "default": "",
            "description": "Which terminal the program believes it runs in (TERM_PROGRAM and\nversion), fixed at start; XTVERSION answers with it.",
            "type": "string"
          },
          "keep": {
            "default": false,
            "description": "Replace a lost program with this machine’s shell, in place. Exit with a code and kill remain final.",
            "type": "boolean"
          },
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "type": "object"
          },
          "name": {
            "type": [
              "string",
              "null"
            ]
          },
          "notify": {
            "default": false,
            "description": "Its parent gets notes about it (see `--no-notify`).",
            "type": "boolean"
          },
          "output": {
            "description": "With `wait`: its text then, like `terminal.read` (the screen, plus\nhistory unless it is a full-screen app).",
            "type": [
              "string",
              "null"
            ]
          },
          "parent": {
            "default": null,
            "description": "The terminal that started it (`t3`), set once at start.",
            "type": [
              "string",
              "null"
            ]
          },
          "paste_gap_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "pid": {
            "format": "uint32",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "reason": {
            "description": "Why its program ended or is pending (`spawn_pending` means its initial\nspawn timed out, but the holder may still be starting it):\nexited, killed, server_stop, host_shutdown (Windows\nis ending the session, including logout), signaled (a kept program\ndied by signal without an exit code), holder_lost (its holder\ndied), stopped_by_restart (nothing ran it any more after a restart).",
            "type": [
              "string",
              "null"
            ]
          },
          "records": {
            "additionalProperties": {
              "$ref": "#/components/schemas/Status"
            },
            "description": "Other 7501 records by id (programs reporting on several things).",
            "type": "object"
          },
          "reported": {
            "default": false,
            "description": "Whether the program ever sent a 7501 report.",
            "type": "boolean"
          },
          "rm": {
            "default": false,
            "description": "Removed right after it exits (once a waiting parent has the exit code).",
            "type": "boolean"
          },
          "rows": {
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "screen": {
            "description": "\"exact\", or \"inexact\" after a core crash (older history may be missing).",
            "type": "string"
          },
          "signal": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "state": {
            "description": "\"live\" or \"finished\".",
            "type": "string"
          },
          "status": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/Status"
              },
              {
                "type": "null"
              }
            ],
            "default": null,
            "description": "The program's own word for what it's doing (OSC 7501 root record);\nnull if it never said, or after it exited."
          },
          "status_ms": {
            "default": null,
            "description": "When that word last changed, ms since the epoch; null if it never said.",
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "stop": {
            "type": [
              "string",
              "null"
            ]
          },
          "submit": {
            "description": "Template overrides: the key that submits a message, the stop key, the pause\nbetween paste and submit.",
            "type": [
              "string",
              "null"
            ]
          },
          "template": {
            "default": null,
            "description": "The template that started it.",
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "default": "",
            "type": "string"
          },
          "turn": {
            "default": 0,
            "description": "Goes up each time the status leaves `working`.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "wait": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/WaitResult"
              },
              {
                "type": "null"
              }
            ],
            "description": "With `wait`: how the wait ended (exit, a status, or timeout: still running)."
          }
        },
        "required": [
          "address",
          "labels",
          "argv",
          "cwd",
          "state",
          "created_ms",
          "screen",
          "cols",
          "rows"
        ],
        "type": "object"
      },
      "SendResult": {
        "properties": {
          "started": {
            "description": "Whether it went `working` within a few seconds; null when it doesn't\nreport status, so nobody can tell.",
            "type": [
              "boolean",
              "null"
            ]
          },
          "status": {
            "description": "The program's status word when the text went in (null: it never said).",
            "type": [
              "string",
              "null"
            ]
          },
          "turn": {
            "description": "The turn when the text went in.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "wait": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/WaitResult"
              },
              {
                "type": "null"
              }
            ],
            "description": "With `wait`: how that turn ended."
          }
        },
        "required": [
          "turn"
        ],
        "type": "object"
      },
      "Status": {
        "description": "One 7501 record. Words are the program's own; nothing is translated.",
        "properties": {
          "app": {
            "type": "string"
          },
          "kind": {
            "description": "permission, question or auth (blocked only, when the program said).",
            "type": [
              "string",
              "null"
            ]
          },
          "msg": {
            "type": "string"
          },
          "progress": {
            "description": "0..100 (working or blocked, when the program said).",
            "format": "uint8",
            "maximum": 255,
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "state": {
            "description": "idle, working, done, blocked or error.",
            "type": "string"
          },
          "title": {
            "type": "string"
          }
        },
        "required": [
          "state"
        ],
        "type": "object"
      },
      "StatusResult": {
        "properties": {
          "core": {
            "$ref": "#/components/schemas/CoreInfo"
          },
          "finished": {
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "holder": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/HolderInfo"
              },
              {
                "type": "null"
              }
            ],
            "description": "The holder new terminals go to."
          },
          "holders": {
            "description": "Every holder: after an update, older ones run their terminals to the end.",
            "items": {
              "$ref": "#/components/schemas/HolderInfo"
            },
            "type": "array"
          },
          "installed_by": {
            "description": "The package manager this hc came from (homebrew, nix, mise): it\nupdates hc, `hc update` won't. Null for a plain install.",
            "type": [
              "string",
              "null"
            ]
          },
          "live": {
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "pid": {
            "format": "uint32",
            "minimum": 0,
            "type": "integer"
          },
          "uptime_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "version": {
            "type": "string"
          }
        },
        "required": [
          "core",
          "version",
          "pid",
          "uptime_ms",
          "holders",
          "live",
          "finished"
        ],
        "type": "object"
      },
      "StopResult": {
        "properties": {
          "stopped": {
            "type": "boolean"
          }
        },
        "required": [
          "stopped"
        ],
        "type": "object"
      },
      "SubscribeResult": {
        "properties": {
          "channel": {
            "description": "Framed mode: the channel events arrive on (JSON lines, with credit).\nPlain mode: none; this connection now carries only notifications.",
            "format": "uint32",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "seq": {
            "description": "Events after this sequence follow. After a `missed` snapshot, ignore\nevents whose seq is not above the snapshot's.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "terminals": {
            "description": "Matching terminals here and on connected machines (`machine/t7`).",
            "items": {
              "$ref": "#/components/schemas/Terminal"
            },
            "type": "array"
          }
        },
        "required": [
          "seq",
          "terminals"
        ],
        "type": "object"
      },
      "TemplateInfo": {
        "properties": {
          "command": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "error": {
            "description": "Set when the file can't be used.",
            "type": [
              "string",
              "null"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "name",
          "description",
          "command"
        ],
        "type": "object"
      },
      "TemplatesResult": {
        "properties": {
          "templates": {
            "items": {
              "$ref": "#/components/schemas/TemplateInfo"
            },
            "type": "array"
          }
        },
        "required": [
          "templates"
        ],
        "type": "object"
      },
      "Terminal": {
        "properties": {
          "address": {
            "description": "`t7`: this terminal forever on this core.",
            "type": "string"
          },
          "argv": {
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "cols": {
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "created_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          },
          "cwd": {
            "type": "string"
          },
          "die_with_parent": {
            "default": false,
            "type": "boolean"
          },
          "exit_code": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "finished_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "foreground": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/Foreground"
              },
              {
                "type": "null"
              }
            ],
            "description": "What runs in it right now and where (null once it has finished)."
          },
          "identity": {
            "default": "",
            "description": "Which terminal the program believes it runs in (TERM_PROGRAM and\nversion), fixed at start; XTVERSION answers with it.",
            "type": "string"
          },
          "keep": {
            "default": false,
            "description": "Replace a lost program with this machine’s shell, in place. Exit with a code and kill remain final.",
            "type": "boolean"
          },
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "type": "object"
          },
          "name": {
            "type": [
              "string",
              "null"
            ]
          },
          "notify": {
            "default": false,
            "description": "Its parent gets notes about it (see `--no-notify`).",
            "type": "boolean"
          },
          "parent": {
            "default": null,
            "description": "The terminal that started it (`t3`), set once at start.",
            "type": [
              "string",
              "null"
            ]
          },
          "paste_gap_ms": {
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "pid": {
            "format": "uint32",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "reason": {
            "description": "Why its program ended or is pending (`spawn_pending` means its initial\nspawn timed out, but the holder may still be starting it):\nexited, killed, server_stop, host_shutdown (Windows\nis ending the session, including logout), signaled (a kept program\ndied by signal without an exit code), holder_lost (its holder\ndied), stopped_by_restart (nothing ran it any more after a restart).",
            "type": [
              "string",
              "null"
            ]
          },
          "records": {
            "additionalProperties": {
              "$ref": "#/components/schemas/Status"
            },
            "description": "Other 7501 records by id (programs reporting on several things).",
            "type": "object"
          },
          "reported": {
            "default": false,
            "description": "Whether the program ever sent a 7501 report.",
            "type": "boolean"
          },
          "rm": {
            "default": false,
            "description": "Removed right after it exits (once a waiting parent has the exit code).",
            "type": "boolean"
          },
          "rows": {
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "screen": {
            "description": "\"exact\", or \"inexact\" after a core crash (older history may be missing).",
            "type": "string"
          },
          "signal": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "state": {
            "description": "\"live\" or \"finished\".",
            "type": "string"
          },
          "status": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/Status"
              },
              {
                "type": "null"
              }
            ],
            "default": null,
            "description": "The program's own word for what it's doing (OSC 7501 root record);\nnull if it never said, or after it exited."
          },
          "status_ms": {
            "default": null,
            "description": "When that word last changed, ms since the epoch; null if it never said.",
            "format": "uint64",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "stop": {
            "type": [
              "string",
              "null"
            ]
          },
          "submit": {
            "description": "Template overrides: the key that submits a message, the stop key, the pause\nbetween paste and submit.",
            "type": [
              "string",
              "null"
            ]
          },
          "template": {
            "default": null,
            "description": "The template that started it.",
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "default": "",
            "type": "string"
          },
          "turn": {
            "default": 0,
            "description": "Goes up each time the status leaves `working`.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "address",
          "labels",
          "argv",
          "cwd",
          "state",
          "created_ms",
          "screen",
          "cols",
          "rows"
        ],
        "type": "object"
      },
      "WaitResult": {
        "properties": {
          "children": {
            "description": "With `children`: one result per child it reports on.",
            "items": {
              "$ref": "#/components/schemas/WaitResult"
            },
            "type": "array"
          },
          "ended": {
            "description": "False on timeout: a check-in, the terminal is still running.",
            "type": "boolean"
          },
          "exit_code": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "from": {
            "description": "With a message: the sender's address (the text is already in your input);\nnull when a person sent it.",
            "type": [
              "string",
              "null"
            ]
          },
          "reason": {
            "description": "status, exit (including program loss in a kept terminal), output, timeout,\nor not_started (after a send: it did not start working; a plain wait\nstill follows that send's turn); with\n`children`: children; message (someone messaged the waiter, any\nwait); for each child in `children`: status, exit, or running (still\nworking).",
            "type": "string"
          },
          "signal": {
            "format": "int32",
            "type": [
              "integer",
              "null"
            ]
          },
          "status": {
            "description": "The exact word the program reported (current word on timeout or output).",
            "type": [
              "string",
              "null"
            ]
          },
          "terminal": {
            "type": "string"
          },
          "turn": {
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "terminal",
          "ended",
          "reason",
          "turn",
          "children"
        ],
        "type": "object"
      }
    }
  },
  "methods": {
    "hello": {
      "params": {
        "type": "object",
        "properties": {
          "calls_you": {
            "description": "What that core calls this one (`rohan`), so news about `t7` reaches it as `rohan/t7`.",
            "type": [
              "string",
              "null"
            ]
          },
          "core": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/CoreInfo"
              },
              {
                "type": "null"
              }
            ],
            "description": "Another core dialing in: who it is. Its terminals may then be parents\nof terminals here, and hear from them."
          },
          "framed": {
            "default": false,
            "description": "Switch this connection to framed mode after the reply.",
            "type": "boolean"
          },
          "generation": {
            "description": "Protocol generation the caller speaks.",
            "format": "uint32",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/HelloResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "unsupported_generation"
          },
          "message": "unsupported_generation"
        }
      ],
      "validator": "core_0",
      "types": [
        "Method0Params",
        "Method0Result"
      ]
    },
    "server.status": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/StatusResult"
      },
      "errors": [],
      "validator": "core_1",
      "types": [
        "Method1Params",
        "Method1Result"
      ]
    },
    "server.stop": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/StopResult"
      },
      "errors": [],
      "validator": "core_2",
      "types": [
        "Method2Params",
        "Method2Result"
      ]
    },
    "server.restart": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/StopResult"
      },
      "errors": [],
      "validator": "core_3",
      "types": [
        "Method3Params",
        "Method3Result"
      ]
    },
    "terminal.run": {
      "params": {
        "type": "object",
        "properties": {
          "argv": {
            "default": [],
            "description": "Program and arguments, or a template name and its task. With neither\nargv nor line: that machine's own shell.",
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "caller": {
            "description": "Who is calling (`HC_TERMINAL_ID` inside a terminal).",
            "type": [
              "string",
              "null"
            ]
          },
          "cwd": {
            "description": "Working directory (default: where hc runs; through the API, the core's;\nwith --on, that machine's home).",
            "type": [
              "string",
              "null"
            ]
          },
          "die_with_parent": {
            "default": false,
            "description": "Ignored: children end with their parent unless `outlive_parent`.",
            "type": "boolean"
          },
          "env": {
            "additionalProperties": {
              "type": "string"
            },
            "default": {},
            "description": "Set on top of the core's environment. Clients pass their terminal\nidentity here (TERM, TERM_PROGRAM, COLORTERM).",
            "type": "object"
          },
          "keep": {
            "default": false,
            "description": "Replace lost programs with a shell in place, never re-run the original command.",
            "type": "boolean"
          },
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "default": {},
            "description": "Labels, key=value (repeatable).",
            "type": "object"
          },
          "line": {
            "description": "A shell line instead of argv, run by that machine's shell (`sh -c`;\nWindows `%COMSPEC% /d /s /c`). The CLI sends one string with spaces or\nshell signs as a line.",
            "type": [
              "string",
              "null"
            ]
          },
          "name": {
            "description": "Name, unique among live terminals: 1-32 of a-z 0-9 - _ .",
            "type": [
              "string",
              "null"
            ]
          },
          "no_notify": {
            "default": false,
            "description": "Don't type notes about it into its parent.",
            "type": "boolean"
          },
          "no_parent": {
            "default": false,
            "description": "No parent, even when started from a terminal.",
            "type": "boolean"
          },
          "on": {
            "description": "Run it on another machine (see `hc machine ls`); its address is `machine/t7`.",
            "type": [
              "string",
              "null"
            ]
          },
          "outlive_parent": {
            "default": false,
            "description": "Keep it running when its parent's program ends (by default it ends too).",
            "type": "boolean"
          },
          "parent": {
            "description": "Parent terminal (default: the terminal it is started from).",
            "type": [
              "string",
              "null"
            ]
          },
          "rm": {
            "default": false,
            "description": "Remove it right after it exits (once a waiting parent has the exit code).",
            "type": "boolean"
          },
          "timeout": {
            "description": "Seconds before a wait checks in, leaving it running (default: config\n`wait_timeout`, else 180).",
            "format": "double",
            "type": [
              "number",
              "null"
            ]
          },
          "wait": {
            "default": false,
            "description": "Then wait until it is not working, like `terminal.wait`, and return its\noutput (the CLI waits unless --bg).",
            "type": "boolean"
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/RunResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "name_taken"
          },
          "message": "name_taken"
        },
        {
          "code": -32000,
          "data": {
            "kind": "spawn_failed"
          },
          "message": "spawn_failed"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "invalid_template"
          },
          "message": "invalid_template"
        },
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "config"
          },
          "message": "config"
        }
      ],
      "validator": "core_4",
      "types": [
        "Method4Params",
        "Method4Result"
      ]
    },
    "templates.list": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/TemplatesResult"
      },
      "errors": [],
      "validator": "core_5",
      "types": [
        "Method5Params",
        "Method5Result"
      ]
    },
    "terminal.list": {
      "params": {
        "type": "object",
        "properties": {
          "all": {
            "default": false,
            "description": "Include finished terminals.",
            "type": "boolean"
          },
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "default": {},
            "description": "Only terminals carrying all of these labels (repeatable).",
            "type": "object"
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/ListResult"
      },
      "errors": [],
      "validator": "core_6",
      "types": [
        "Method6Params",
        "Method6Result"
      ]
    },
    "terminal.get": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "description": "Who is calling; a parent looking at its child has seen its news.",
            "type": [
              "string",
              "null"
            ]
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Terminal"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_7",
      "types": [
        "Method7Params",
        "Method7Result"
      ]
    },
    "terminal.kill": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "description": "Who is calling; a parent looking at its child has seen its news.",
            "type": [
              "string",
              "null"
            ]
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Terminal"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_8",
      "types": [
        "Method8Params",
        "Method8Result"
      ]
    },
    "terminal.rm": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "description": "Who is calling; a parent looking at its child has seen its news.",
            "type": [
              "string",
              "null"
            ]
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/RemoveResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "live"
          },
          "message": "live"
        }
      ],
      "validator": "core_9",
      "types": [
        "Method9Params",
        "Method9Result"
      ]
    },
    "terminal.keep": {
      "params": {
        "type": "object",
        "properties": {
          "keep": {
            "description": "Keep this live terminal after loss. Existing streams end with the loss reason; reattach after `restarted`.",
            "type": "boolean"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "keep",
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Terminal"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        }
      ],
      "validator": "core_10",
      "types": [
        "Method10Params",
        "Method10Result"
      ]
    },
    "terminal.label": {
      "params": {
        "type": "object",
        "properties": {
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "description": "Labels to set, key=value; `key=` removes one.",
            "type": "object"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "labels",
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Terminal"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        }
      ],
      "validator": "core_11",
      "types": [
        "Method11Params",
        "Method11Result"
      ]
    },
    "terminal.read": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "type": [
              "string",
              "null"
            ]
          },
          "lines": {
            "default": 0,
            "description": "Lines of history above the screen.",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/ReadResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_12",
      "types": [
        "Method12Params",
        "Method12Result"
      ]
    },
    "terminal.attach": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "default": null,
            "description": "Who is calling (`HC_TERMINAL_ID` inside a terminal): never itself.",
            "type": [
              "string",
              "null"
            ]
          },
          "cols": {
            "description": "The viewer's size in cells.",
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "display": {
            "$ref": "#/components/schemas/Display",
            "default": {
              "bg": null,
              "cell": null,
              "cursor": null,
              "fg": null
            },
            "description": "The viewer's own colors and cell size, used to answer display queries."
          },
          "history": {
            "default": 0,
            "description": "Scrollback lines to show first (main screen only).",
            "format": "uint",
            "minimum": 0,
            "type": "integer"
          },
          "observe": {
            "default": false,
            "description": "Watch only: never type or resize.",
            "type": "boolean"
          },
          "resumed": {
            "default": false,
            "description": "Back after a dropped line: sets the size only once active again.",
            "type": "boolean"
          },
          "rows": {
            "format": "uint16",
            "maximum": 65535,
            "minimum": 0,
            "type": "integer"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "cols",
          "rows",
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/AttachResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "finished"
          },
          "message": "finished"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_framed"
          },
          "message": "needs_framed"
        }
      ],
      "validator": "core_13",
      "types": [
        "Method13Params",
        "Method13Result"
      ]
    },
    "terminal.send": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "description": "Who is sending (`HC_TERMINAL_ID`, else the calling process's parent), so a\nbare wait from the same caller waits for this send's turn.",
            "type": [
              "string",
              "null"
            ]
          },
          "force": {
            "default": false,
            "description": "Type even if the program is blocked (it may answer its dialog).",
            "type": "boolean"
          },
          "if": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/IdleOrWorking"
              },
              {
                "type": "null"
              }
            ],
            "description": "Only type if the status is exactly this."
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          },
          "text": {
            "description": "Pasted, then submitted with Enter.",
            "type": "string"
          },
          "timeout": {
            "description": "With wait: seconds before it checks in (default: config, else 180).",
            "format": "double",
            "type": [
              "number",
              "null"
            ]
          },
          "wait": {
            "default": false,
            "description": "Then wait for the turn this send started.",
            "type": "boolean"
          }
        },
        "required": [
          "terminal",
          "text"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/SendResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "finished"
          },
          "message": "finished"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "blocked"
          },
          "message": "blocked"
        },
        {
          "code": -32000,
          "data": {
            "kind": "status_mismatch"
          },
          "message": "status_mismatch"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "config"
          },
          "message": "config"
        }
      ],
      "validator": "core_14",
      "types": [
        "Method14Params",
        "Method14Result"
      ]
    },
    "terminal.wait": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "description": "See `terminal.send`.",
            "type": [
              "string",
              "null"
            ]
          },
          "children": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/Children"
              },
              {
                "type": "null"
              }
            ],
            "description": "Wait on children instead: all = until none is working, any = next news or a message to you.\n\n`all`: until none of the children is working (one that hasn't reported\nyet counts as working). `any`: the parent's unseen news (a turn ended, it\nblocked, it hit an error, it exited), else the next child to stop working; for the parent\nitself, also a message typed into it while it worked (reason `message`)."
          },
          "output": {
            "description": "For programs, not agents: end when output printed after the wait started\ncontains this text (plain text, escape sequences stripped). Blocked,\nerror or exit end it too.",
            "type": [
              "string",
              "null"
            ]
          },
          "terminal": {
            "description": "The terminal; with `children`, whose children (default: the caller).",
            "type": [
              "string",
              "null"
            ]
          },
          "timeout": {
            "description": "Seconds before it checks in (default: config `wait_timeout`, else 180).",
            "format": "double",
            "type": [
              "number",
              "null"
            ]
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/WaitResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_target"
          },
          "message": "needs_target"
        },
        {
          "code": -32000,
          "data": {
            "kind": "config"
          },
          "message": "config"
        }
      ],
      "validator": "core_15",
      "types": [
        "Method15Params",
        "Method15Result"
      ]
    },
    "terminal.keys": {
      "params": {
        "type": "object",
        "properties": {
          "caller": {
            "type": [
              "string",
              "null"
            ]
          },
          "keys": {
            "description": "Key names: enter, esc, tab, up, ctrl+c, alt+x, f5, a, ...",
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "keys",
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/KeysResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "finished"
          },
          "message": "finished"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        }
      ],
      "validator": "core_16",
      "types": [
        "Method16Params",
        "Method16Result"
      ]
    },
    "terminal.interrupt": {
      "params": {
        "type": "object",
        "properties": {
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          },
          "timeout": {
            "description": "Seconds to watch for an effect (default 10).",
            "format": "double",
            "type": [
              "number",
              "null"
            ]
          }
        },
        "required": [
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/InterruptResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "finished"
          },
          "message": "finished"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        }
      ],
      "validator": "core_17",
      "types": [
        "Method17Params",
        "Method17Result"
      ]
    },
    "terminal.put": {
      "params": {
        "type": "object",
        "properties": {
          "data": {
            "description": "Its bytes, base64; at most 8 MB raw.",
            "type": "string"
          },
          "name": {
            "description": "The file's name, kept so `.png` stays `.png` (CLI: the local file to send).",
            "type": "string"
          },
          "terminal": {
            "description": "The terminal: `t7`, a name, or `machine/t7`.",
            "type": "string"
          }
        },
        "required": [
          "data",
          "name",
          "terminal"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/PutResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "finished"
          },
          "message": "finished"
        },
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        }
      ],
      "validator": "core_18",
      "types": [
        "Method18Params",
        "Method18Result"
      ]
    },
    "machine.exec": {
      "params": {
        "type": "object",
        "properties": {
          "argv": {
            "description": "Program and arguments, run as given (no shell).",
            "items": {
              "type": "string"
            },
            "type": "array"
          },
          "cwd": {
            "description": "Working directory (default: where hc runs; through the API, the core's;\nwith --on, that machine's home).",
            "type": [
              "string",
              "null"
            ]
          },
          "env": {
            "additionalProperties": {
              "type": "string"
            },
            "default": {},
            "description": "Set on top of the core's environment, key=value (repeatable).",
            "type": "object"
          },
          "input": {
            "description": "Bytes for its stdin, base64, at most 8 MB raw (without: stdin is closed).",
            "type": [
              "string",
              "null"
            ]
          },
          "line": {
            "description": "A shell line instead of argv, run by that machine's shell (`sh -c`;\nWindows `%COMSPEC% /d /s /c`). The CLI sends one string with spaces or\nshell signs as a line.",
            "type": [
              "string",
              "null"
            ]
          },
          "on": {
            "description": "Run it on another machine (see `hc machine ls`).",
            "type": [
              "string",
              "null"
            ]
          },
          "timeout": {
            "description": "Seconds before it and everything it started are ended (default 60, at most 600).",
            "format": "double",
            "type": [
              "number",
              "null"
            ]
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/ExecResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "spawn_failed"
          },
          "message": "spawn_failed"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_19",
      "types": [
        "Method19Params",
        "Method19Result"
      ]
    },
    "file.read": {
      "params": {
        "type": "object",
        "properties": {
          "cwd": {
            "description": "Where a relative path starts (default: where hc runs; through the API,\nthe core's; with --on, that machine's home).",
            "type": [
              "string",
              "null"
            ]
          },
          "limit": {
            "description": "At most this many lines (default: all, up to 8 MB).",
            "format": "uint",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "offset": {
            "description": "The first line to give, from 1.",
            "format": "uint",
            "minimum": 0,
            "type": [
              "integer",
              "null"
            ]
          },
          "on": {
            "description": "On another machine (see `hc machine ls`).",
            "type": [
              "string",
              "null"
            ]
          },
          "path": {
            "description": "The file: absolute, or from `cwd`.",
            "type": "string"
          }
        },
        "required": [
          "path"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/FileReadResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "not_text"
          },
          "message": "not_text"
        },
        {
          "code": -32000,
          "data": {
            "kind": "io"
          },
          "message": "io"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_20",
      "types": [
        "Method20Params",
        "Method20Result"
      ]
    },
    "file.write": {
      "params": {
        "type": "object",
        "properties": {
          "cwd": {
            "description": "Where a relative path starts (default: where hc runs; through the API,\nthe core's; with --on, that machine's home).",
            "type": [
              "string",
              "null"
            ]
          },
          "data": {
            "description": "Its new content, base64, at most 8 MB raw (CLI: what is piped in).",
            "type": "string"
          },
          "on": {
            "description": "On another machine (see `hc machine ls`).",
            "type": [
              "string",
              "null"
            ]
          },
          "path": {
            "description": "The file: absolute, or from `cwd`.",
            "type": "string"
          }
        },
        "required": [
          "data",
          "path"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/FileResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "io"
          },
          "message": "io"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_21",
      "types": [
        "Method21Params",
        "Method21Result"
      ]
    },
    "file.edit": {
      "params": {
        "type": "object",
        "properties": {
          "cwd": {
            "description": "Where a relative path starts (default: where hc runs; through the API,\nthe core's; with --on, that machine's home).",
            "type": [
              "string",
              "null"
            ]
          },
          "edits": {
            "description": "Replacements, all made or none (CLI: --old/--new pairs).",
            "items": {
              "$ref": "#/components/schemas/Edit"
            },
            "type": "array"
          },
          "on": {
            "description": "On another machine (see `hc machine ls`).",
            "type": [
              "string",
              "null"
            ]
          },
          "path": {
            "description": "The file: absolute, or from `cwd`.",
            "type": "string"
          }
        },
        "required": [
          "edits",
          "path"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/FileResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "edit_failed"
          },
          "message": "edit_failed"
        },
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "not_text"
          },
          "message": "not_text"
        },
        {
          "code": -32000,
          "data": {
            "kind": "io"
          },
          "message": "io"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_22",
      "types": [
        "Method22Params",
        "Method22Result"
      ]
    },
    "doc.get": {
      "params": {
        "type": "object",
        "properties": {
          "name": {
            "description": "Document name, using the terminal name rules.",
            "type": "string"
          },
          "on": {
            "description": "Another machine; omitted for this core.",
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "name"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/DocGetResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_23",
      "types": [
        "Method23Params",
        "Method23Result"
      ]
    },
    "doc.set": {
      "params": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "on": {
            "type": [
              "string",
              "null"
            ]
          },
          "value": {
            "description": "Any JSON value, at most 1 MiB when serialized; null deletes it."
          },
          "version": {
            "description": "Current version from doc.get; zero for a name never written.",
            "format": "uint64",
            "minimum": 0,
            "type": "integer"
          }
        },
        "required": [
          "name",
          "value",
          "version"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/DocSetResult"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "conflict"
          },
          "message": "conflict"
        },
        {
          "code": -32000,
          "data": {
            "kind": "internal"
          },
          "message": "internal"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unavailable"
          },
          "message": "unavailable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "needs_update"
          },
          "message": "needs_update"
        }
      ],
      "validator": "core_24",
      "types": [
        "Method24Params",
        "Method24Result"
      ]
    },
    "events.subscribe": {
      "params": {
        "type": "object",
        "properties": {
          "children_of": {
            "description": "Only children of this terminal.",
            "type": [
              "string",
              "null"
            ]
          },
          "labels": {
            "additionalProperties": {
              "type": "string"
            },
            "default": {},
            "description": "Only terminals carrying all of these labels (repeatable).",
            "type": "object"
          },
          "terminal": {
            "description": "Only this terminal.",
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/SubscribeResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "not_found"
          },
          "message": "not_found"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_25",
      "types": [
        "Method25Params",
        "Method25Result"
      ]
    },
    "machine.add": {
      "params": {
        "type": "object",
        "properties": {
          "name": {
            "description": "What to call it here (default: the target's host).",
            "type": [
              "string",
              "null"
            ]
          },
          "session": {
            "description": "The hc session on that machine (default: its default).",
            "type": [
              "string",
              "null"
            ]
          },
          "target": {
            "description": "How ssh reaches it: `vps`, `can@10.0.0.7`, a Host from ~/.ssh/config.",
            "type": [
              "string",
              "null"
            ]
          },
          "temporary": {
            "default": false,
            "description": "Mark it short-lived (a sandbox for a task), so clients can show it apart\nfrom machines that stay. hc treats it like any other; remove it with\n`hc machine rm`.",
            "type": "boolean"
          },
          "via": {
            "description": "Reach it with this command instead of ssh: it is given a shell line to\nrun there as its last argument, like ssh (`ssh -p 2222 -i key user@ip`,\n`fly ssh console -a app --pty=false -C`). It must pass bytes both ways\nuntouched and ask nothing. Needs --name.",
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Machine"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "name_taken"
          },
          "message": "name_taken"
        },
        {
          "code": -32000,
          "data": {
            "kind": "already_added"
          },
          "message": "already_added"
        },
        {
          "code": -32000,
          "data": {
            "kind": "unreachable"
          },
          "message": "unreachable"
        },
        {
          "code": -32000,
          "data": {
            "kind": "hc_missing"
          },
          "message": "hc_missing"
        },
        {
          "code": -32000,
          "data": {
            "kind": "incompatible"
          },
          "message": "incompatible"
        }
      ],
      "validator": "core_26",
      "types": [
        "Method26Params",
        "Method26Result"
      ]
    },
    "machine.list": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/MachineListResult"
      },
      "errors": [],
      "validator": "core_27",
      "types": [
        "Method27Params",
        "Method27Result"
      ]
    },
    "machine.connect": {
      "params": {
        "type": "object",
        "properties": {
          "machine": {
            "description": "The machine's name.",
            "type": "string"
          }
        },
        "required": [
          "machine"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/MachineView"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_28",
      "types": [
        "Method28Params",
        "Method28Result"
      ]
    },
    "machine.rename": {
      "params": {
        "type": "object",
        "properties": {
          "machine": {
            "description": "The machine's name now.",
            "type": "string"
          },
          "new_name": {
            "description": "Its new name. Addresses with the old one stop working.",
            "type": "string"
          }
        },
        "required": [
          "machine",
          "new_name"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/Machine"
      },
      "errors": [
        {
          "code": -32602,
          "data": {
            "kind": "invalid_params"
          },
          "message": "invalid_params"
        },
        {
          "code": -32000,
          "data": {
            "kind": "name_taken"
          },
          "message": "name_taken"
        },
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_29",
      "types": [
        "Method29Params",
        "Method29Result"
      ]
    },
    "machine.rm": {
      "params": {
        "type": "object",
        "properties": {
          "machine": {
            "description": "The machine's name.",
            "type": "string"
          }
        },
        "required": [
          "machine"
        ],
        "additionalProperties": false
      },
      "result": {
        "$ref": "#/components/schemas/RemoveResult"
      },
      "errors": [
        {
          "code": -32000,
          "data": {
            "kind": "machine_unknown"
          },
          "message": "machine_unknown"
        }
      ],
      "validator": "core_30",
      "types": [
        "Method30Params",
        "Method30Result"
      ]
    },
    "rpc.discover": {
      "params": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "result": {
        "$ref": "https://meta.open-rpc.org/"
      },
      "errors": [],
      "validator": "core_31",
      "types": [
        "Method31Params",
        "Method31Result"
      ]
    }
  }
} as const;
export const schemaSha256 = '41f3e7734499e114a9a1b88f963b83823ad8383eb5e40fdacdeced2682ad92ba';
