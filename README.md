# Middlifier

Middlifier provides an interactive tool to build a server and middleware with **type and value validation** and **hot reload**. It checks the types and values, which are provided from the app in the middleware and which arrive at the server. As developer you can build a server and middleware very fast and save.

## Installation

- `npm install middlifier`

## Commands

- `npx middlifier-init`
- `npx middlifier-end`

## Type Validation

Type Validation takes place with [Zod](https://zod.dev/).

Example of generated Code from middlifier:

```typescript
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export async function getUser(req: Request, res: Response, next: NextFunction) {
  const schema = z.object({ name: z.array(z.string()) });
  const body: z.infer<typeof schema> = req.body;
  schema.parse(body);
  const { name } = body;
}
```

Corresponding configuration from the mid.config.ts

```yml
{
  user:
    {
      getUser:
        { req: { body: { name: { type: ["string"], required: true } } } },
    },
}
```

## Value Validation

| Type   | Options      |
| ------ | ------------ |
| String | Regex, Enums |
| Number | Min, Max     |

## Hot Reload

For hot reload is [nodemon](https://nodemon.io/) used. Nodemon checks if changes in the "mid.config.ts" appear.

## Features

- [x] TypeScript support
- [ ] JavaScript support
- [x] Value Validation
- [x] Type Validation
- [x] Docker build
- [x] Drizzle build
- [x] Environment variables config
- [x] Server entrypoint build
- [x] Funcs build
- [ ] Urlencoded support params - **will be finished at 20.05.2024**
- [ ] Prebuild server-functions Logger, OAuth2 - **will be finished at 20.05.2024**
- [x] Route build
- [ ] Automatic generation of documentation
- [ ] Middleware build
- [ ] [Strapi](https://strapi.io/) integration
- [ ] Support for bun and npm
- [ ] Test build
- [ ] Automatic execution of tests
- [ ] Doku build
- **Add an Issue type enhancement for more feature ideas!**

## Getting Started

1. Navigate to your project folder: `cd 'project-folder'`
2. Set up Node: `npm init -y`
3. Install Middlifier: `npm i middlifier`
4. Set up builder: `npx middlifier-init`
5. Navigate to the "gen" folder: `cd gen`
6. Start builder: `npm run dev`
7. Edit "mid.config.ts" in the "gen/src" folder
8. Navigate to your project folder: `cd ..`
9. Delete unnecessary files with: `npx middlifier-end`

```typescript
import { MidConfig } from "middlifier";
export const config: MidConfig = {
  server: {
    port: 3000,
    funcs: {},
  },
  app: {},
};
```

## Structure of MidConfig

```typescript
type MidConfig = {
  language?: "ts" | "js"; // language in which the server and middleware is builded Typescript or JavaScript
  server: {
    port: number | string; // string if you want to use an environment variable
    host?: string; // url of server
    ssl?: boolean; // secure connection
    set?: {
      [key: string]: any;
    };
    cors?: CorsOptions; // cors options for the server app.use(cors(MidConfig.server.cors))
    funcs: {
      [path: string]: {
        [fileName: string]: {
          [funcName: string]: {
            method?:
              | "GET"
              | "POST"
              | "PUT"
              | "DELETE"
              | "PATCH"
              | "OPTIONS"
              | "HEAD"
              | "CONNECT"
              | "TRACE";
            req?:
              | {
                  body?: {
                    [key: string]: { type: ParamType; required?: boolean };
                  };
                  params?: {
                    [key: string]: {
                      type: ParamType;
                      required?: boolean;
                      urlencoded?: boolean;
                    };
                  };
                  dynamicRoute?: never;
                }
              | {
                  body?: {
                    [key: string]: { type: ParamType; required?: boolean };
                  };
                  params?: never;
                  dynamicRoute?: string;
                };
            res?: {};
          };
        };
      };
    };
    indexFuncNames?: string[];
    routes?: {
      [key: string]:
        | Routes
        | [
            {
              [key: string]: Routes;
            },
            [string] | [string, string] // [path] or [path, funcName]
          ];
    };
    json?: OptionsJson; // json options for the server app.use(cors(MidConfig.server.json))
    urlencoded?: OptionsUrlencoded; // urlencoded options for the server app.use(cors(MidConfig.server.urlencoded))
    drizzle?: {
      config: Config;
      dbConfig: PoolConfig;
      schemas?: {
        [key: string]: {
          [key: string]: {
            type: "serial" | "text" | "integer" | "real";
            name: string;
            primaryKey?: boolean;
          };
        };
      };
    };
    secrets?: {
      // environment variables you yould like to set in a ".env" file
      [key: string]: string;
    };
    docker?: [
      (
        | "FROM"
        | "RUN"
        | "CMD"
        | "LABEL"
        | "EXPOSE"
        | "ENV"
        | "ADD"
        | "COPY"
        | "ENTRYPOINT"
        | "VOLUME"
        | "USER"
        | "WORKDIR"
        | "ARG"
        | "ONBUILD"
        | "STOPSIGNAL"
        | "HEALTHCHECK"
        | "SHELL"
      ),
      string
    ][];
  };
  app: {};
};
```

**I am looking for open source non-profit-oriented developers. If you are interested contact me: baerwald.erik@gmail.com! 🚀**
